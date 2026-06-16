// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
	address public feeAccount;
	uint256 public feePercent;
	mapping(address => mapping(address => uint256)) public tokens;
	mapping(uint256 =>_Order) public orders;
	uint256 public orderCount;
	mapping(uint256 => bool) public orderCancelled;
	mapping(uint256 => bool) public orderFilled;
	

	event Deposit(
		address token, 
		address user, 
		uint256 amount, 
		uint256 balance
	);
	event Withdraw(
		address token, 
		address user, 
		uint256 amount, 
		uint256 balance
	);
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
	    uint256 timestamp
	);

	struct _Order {
	    uint256 id;
	    address user;

	    address tokenGet;
	    uint256 amountGet;

	    address tokenGive;
	    uint256 amountGive;

	    uint256 timestamp;
}
	

	constructor(address _feeAccount, uint256 _feePercent) {
		feeAccount = _feeAccount;
		feePercent =  _feePercent;
	}

	function depositToken(address _token, uint256 _amount) public {

		require(Token(_token).transferFrom(msg.sender, address(this), _amount));

		tokens[_token][msg.sender] = tokens[_token][msg.sender] + _amount;

		emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
	}

	function withdrawToken(address _token, uint256 _amount) public {
		require(tokens[_token][msg.sender] >= _amount);
		Token(_token).transfer(msg.sender, _amount);
		tokens[_token][msg.sender] = tokens[_token][msg.sender] - _amount;
		emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
	}

	function balanceOf(address _token, address _user)
		public
		view
		returns (uint256)
	{
		return tokens[_token][_user];
	}



	function makeOrder(
    address _tokenGet,
    uint256 _amountGet,
    address _tokenGive,
    uint256 _amountGive
	) public {

    require(
        tokens[_tokenGive][msg.sender] >= _amountGive,
        "insufficient balance"
    );

    orderCount ++;

    orders[orderCount] = _Order(
        orderCount,
        msg.sender,
        _tokenGet,
        _amountGet,
        _tokenGive,
        _amountGive,
        block.timestamp
    );

	    emit Order(
	        orderCount,
	        msg.sender,
	        _tokenGet,
	        _amountGet,
	        _tokenGive,
	        _amountGive,
	        block.timestamp
	    );
	}

	function cancelOrder(uint256 _id) public {

		_Order storage _order = orders[_id];
	
		require(_order.user == msg.sender, "not owner");

		require(_order.id == _id);

		orderCancelled[_id] = true;



		emit Cancel(
	        _order.id,
	        msg.sender,
	        _order.tokenGet,
	        _order.amountGet,
	        _order.tokenGive,
	        _order.amountGive,
	        block.timestamp
	    );
	}

	function fillOrder(uint256 _id) public {


	require(_id > 0 && _id <= orderCount, "Order does not exitst");
	require(!orderFilled[_id]);
	require(!orderCancelled[_id]);



		
    require(!orderCancelled[_id], "order cancelled");

    _Order storage _order = orders[_id];

    require(_order.user != address(0), "order does not exist");
    require(_order.user != msg.sender, "cannot fill your own order");

    _trade(
        _order.id,
        _order.user,
        _order.tokenGet,
        _order.amountGet,
        _order.tokenGive,
        _order.amountGive
    );

    orderFilled[_order.id] = true;
}

		function _trade(
	    uint256 _orderId,
	    address _user,
	    address _tokenGet,
	    uint256 _amountGet,
	    address _tokenGive,
	    uint256 _amountGive
	) internal {

	    uint256 _feeAmount = (_amountGet * feePercent) / 100;

	    // buyer pays full amount + fee
	    tokens[_tokenGet][msg.sender] -= (_amountGet + _feeAmount);

	    // seller receives FULL amount
	    tokens[_tokenGet][_user] += _amountGet;

	    // fee goes to fee account
	    tokens[_tokenGet][feeAccount] += _feeAmount;

	    // seller gives tokenGive
	    tokens[_tokenGive][_user] -= _amountGive;

	    // buyer receives tokenGive
	    tokens[_tokenGive][msg.sender] += _amountGive;


	    emit Trade(
		    _orderId,
		    msg.sender,
		    _tokenGet,
		    _amountGet,
		    _tokenGive,
		    _amountGive,
		    block.timestamp
		);
	}
}
