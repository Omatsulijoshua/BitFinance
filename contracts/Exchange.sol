// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract Exchange {
    address public owner;
    address public feeAccount;
    uint256 public feePercent;

    modifier onlyOwner() {
        require(msg.sender == owner, "caller is not the owner");
        _;
    }
    mapping(address => mapping(address => uint256)) public tokens;
    mapping(uint256 => OrderData) public orders;
    uint256 public orderCount;
    mapping(uint256 => bool) public orderCancelled;
    mapping(uint256 => bool) public orderFilled;

    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint256 amount, uint256 balance);
    event Order(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );
    event Cancel(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );
    event Trade(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        address creator,
        uint256 timestamp
    );

    struct OrderData {
        uint256 id;
        address user;
        address tokenGet;
        uint256 amountGet;
        address tokenGive;
        uint256 amountGive;
        uint256 timestamp;
    }

    constructor(address _feeAccount, uint256 _feePercent) {
        require(_feeAccount != address(0), "invalid fee account");

        feeAccount = _feeAccount;
        feePercent = _feePercent;
        owner = msg.sender;
    }

    function setFeeAccount(address _feeAccount) public onlyOwner {
        require(_feeAccount != address(0), "invalid fee account");
        feeAccount = _feeAccount;
    }

    function setFeePercent(uint256 _feePercent) public onlyOwner {
        feePercent = _feePercent;
    }

    function depositToken(address _token, uint256 _amount) public {
        require(_token != address(0), "invalid token");
        require(_amount > 0, "amount must be greater than zero");
        require(IERC20(_token).transferFrom(msg.sender, address(this), _amount), "transfer failed");

        tokens[_token][msg.sender] += _amount;

        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function withdrawToken(address _token, uint256 _amount) public {
        require(tokens[_token][msg.sender] >= _amount, "insufficient balance");

        tokens[_token][msg.sender] -= _amount;
        require(IERC20(_token).transfer(msg.sender, _amount), "transfer failed");

        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function balanceOf(address _token, address _user) public view returns (uint256) {
        return tokens[_token][_user];
    }

    function makeOrder(
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) public {
        require(_tokenGet != address(0), "invalid token get");
        require(_tokenGive != address(0), "invalid token give");
        require(_amountGet > 0, "amount get must be greater than zero");
        require(_amountGive > 0, "amount give must be greater than zero");
        require(tokens[_tokenGive][msg.sender] >= _amountGive, "insufficient balance");

        uint256 matchingOrderId = findMatchingOrder(_tokenGet, _amountGet, _tokenGive, _amountGive);

        orderCount++;
        orders[orderCount] = OrderData(
            orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp
        );

        emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);

        if (matchingOrderId != 0) {
            _tradeMatchedOrders(matchingOrderId, orderCount);
        }
    }

    function cancelOrder(uint256 _id) public {
        require(_id > 0 && _id <= orderCount, "order does not exist");
        require(!orderFilled[_id], "order already filled");
        require(!orderCancelled[_id], "order already cancelled");

        OrderData storage order = orders[_id];
        require(order.user == msg.sender, "not owner");

        orderCancelled[_id] = true;

        emit Cancel(
            order.id,
            msg.sender,
            order.tokenGet,
            order.amountGet,
            order.tokenGive,
            order.amountGive,
            block.timestamp
        );
    }

    function fillOrder(uint256 _id) public {
        require(_id > 0 && _id <= orderCount, "order does not exist");
        require(!orderFilled[_id], "order already filled");
        require(!orderCancelled[_id], "order cancelled");

        OrderData storage order = orders[_id];
        require(order.user != msg.sender, "cannot fill your own order");
        require(tokens[order.tokenGet][msg.sender] >= order.amountGet, "insufficient balance");

        _trade(order, msg.sender);
        orderFilled[_id] = true;
    }

    function findMatchingOrder(
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) public view returns (uint256) {
        for (uint256 id = 1; id <= orderCount; id++) {
            OrderData storage candidate = orders[id];

            if (
                !orderCancelled[id] &&
                !orderFilled[id] &&
                candidate.user != msg.sender &&
                candidate.tokenGet == _tokenGive &&
                candidate.tokenGive == _tokenGet &&
                candidate.amountGet == _amountGive &&
                candidate.amountGive == _amountGet &&
                tokens[candidate.tokenGive][candidate.user] >= candidate.amountGive
            ) {
                return id;
            }
        }

        return 0;
    }

    function _tradeMatchedOrders(uint256 _makerOrderId, uint256 _takerOrderId) internal {
        OrderData storage makerOrder = orders[_makerOrderId];
        OrderData storage takerOrder = orders[_takerOrderId];

        require(tokens[takerOrder.tokenGive][takerOrder.user] >= takerOrder.amountGive, "insufficient balance");

        _trade(makerOrder, takerOrder.user);

        orderFilled[_makerOrderId] = true;
        orderFilled[_takerOrderId] = true;
    }

    function _trade(OrderData storage _order, address _filler) internal {
        uint256 makerFee = (_order.amountGet * feePercent) / 200;
        uint256 fillerFee = (_order.amountGive * feePercent) / 200;

        tokens[_order.tokenGet][_filler] -= _order.amountGet;
        tokens[_order.tokenGet][_order.user] += (_order.amountGet - makerFee);
        tokens[_order.tokenGet][feeAccount] += makerFee;

        tokens[_order.tokenGive][_order.user] -= _order.amountGive;
        tokens[_order.tokenGive][_filler] += (_order.amountGive - fillerFee);
        tokens[_order.tokenGive][feeAccount] += fillerFee;

        emit Trade(
            _order.id,
            _filler,
            _order.tokenGet,
            _order.amountGet,
            _order.tokenGive,
            _order.amountGive,
            _order.user,
            block.timestamp
        );
    }
}
