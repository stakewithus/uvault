# @version 0.2.4
"""
Transaction receiver used to test gas relayer
"""

data: public(Bytes[10000])

@external
def callMe(_data: Bytes[10000]):
    self.data = _data