interface Strategy:
    def want() -> address: view
    def getBalance() -> uint256: view
    def deposit(amount: uint256): nonpayable
    def withdraw(amount: uint256): nonpayable