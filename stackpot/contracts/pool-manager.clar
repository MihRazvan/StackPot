;; StackPot Pool Manager Contract
;; Handles deposits, withdrawals, and participant tracking

;; Error codes
(define-constant ERR_INSUFFICIENT_BALANCE (err u100))
(define-constant ERR_ZERO_AMOUNT (err u101))
(define-constant ERR_TRANSFER_FAILED (err u102))
(define-constant ERR_NOT_PARTICIPANT (err u103))
(define-constant ERR_PARTICIPANT_LIST_FULL (err u104))

;; Contract owner (for emergency functions if needed)
(define-constant CONTRACT_OWNER tx-sender)

;; Maximum participants we can track (Clarity list limit)
(define-constant MAX_PARTICIPANTS u500)

;; Data storage
(define-map participant-balances principal uint)
(define-data-var total-pool-size uint u0)
(define-data-var participant-count uint u0)
;; We'll use a map to track if someone is a participant instead of a list initially
(define-map is-participant principal bool)

;; Read-only functions

(define-read-only (get-participant-balance (participant principal))
  (default-to u0 (map-get? participant-balances participant))
)

(define-read-only (get-total-pool-size)
  (var-get total-pool-size)
)

(define-read-only (get-participant-count)
  (var-get participant-count)
)

(define-read-only (is-active-participant (participant principal))
  (default-to false (map-get? is-participant participant))
)

;; Public functions

;; Deposit STX into the pool
(define-public (deposit (amount uint))
  (begin
    ;; Validate amount
    (asserts! (> amount u0) ERR_ZERO_AMOUNT)
    
    ;; Check if we can add new participant
    (if (is-none (map-get? is-participant tx-sender))
      (asserts! (< (var-get participant-count) MAX_PARTICIPANTS) ERR_PARTICIPANT_LIST_FULL)
      true
    )
    
    ;; Transfer STX from sender to contract
    (match (stx-transfer? amount tx-sender (as-contract tx-sender))
      success
        (begin
          ;; Update participant balance
          (let ((current-balance (get-participant-balance tx-sender)))
            (map-set participant-balances tx-sender (+ current-balance amount))
            
            ;; Add to participants if new
            (if (is-eq current-balance u0)
              (begin
                (map-set is-participant tx-sender true)
                (var-set participant-count (+ (var-get participant-count) u1))
              )
              false
            )
            
            ;; Update total pool size
            (var-set total-pool-size (+ (var-get total-pool-size) amount))
            (ok amount)
          )
        )
      error ERR_TRANSFER_FAILED
    )
  )
)

;; Withdraw STX from the pool
(define-public (withdraw (amount uint))
  (let ((current-balance (get-participant-balance tx-sender)))
    ;; Validate withdrawal
    (asserts! (> amount u0) ERR_ZERO_AMOUNT)
    (asserts! (>= current-balance amount) ERR_INSUFFICIENT_BALANCE)
    
    ;; Transfer STX from contract to sender - FIXED LINE
    (match (as-contract (stx-transfer? amount (as-contract tx-sender) tx-sender))
      success
        (begin
          ;; Update balance
          (let ((new-balance (- current-balance amount)))
            (map-set participant-balances tx-sender new-balance)
            
            ;; Remove from participants if balance is zero
            (if (is-eq new-balance u0)
              (begin
                (map-delete is-participant tx-sender)
                (var-set participant-count (- (var-get participant-count) u1))
              )
              false
            )
            
            ;; Update total pool size
            (var-set total-pool-size (- (var-get total-pool-size) amount))
            (ok amount)
          )
        )
      error ERR_TRANSFER_FAILED
    )
  )
)

;; Withdraw all STX from the pool
(define-public (withdraw-all)
  (let ((balance (get-participant-balance tx-sender)))
    (if (> balance u0)
      (withdraw balance)
      (ok u0)
    )
  )
)

;; Get contract STX balance (for verification)
(define-read-only (get-contract-stx-balance)
  (stx-get-balance (as-contract tx-sender))
)