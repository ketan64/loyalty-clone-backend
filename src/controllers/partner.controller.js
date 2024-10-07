const catchAsync = require('../utils/catchAsync.js');
const { partnerService } = require('../services/index.js');
const { memberService } = require('../services/index.js');
const { ruleService } = require('../services/index.js')
const { transactionService } = require('../services/index.js');
const member = require('../models/member.model.js');
const transaction = require('../models/transaction.model.js')
const { v4 } = require('uuid');
const rule = require('../models/rule.model.js');
const { filter } = require('lodash');

const createPartner = catchAsync(async (req, res) => {
  const { body } = req;
  const partnerDetails = await partnerService.getPartner({ partnerName: body.partnerName });
  if (partnerDetails) return res.send({ success: false, message: 'Partner already exist' });
  const response = await partnerService.addPartner(body);
  res.send(response);
});

const updatePartner = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { body } = req;
  const partnerDetails = await partnerService.getPartner({ _id: id });
  if (!partnerDetails) res.send({ success: true, message: 'partner does not exist' });
  await partnerService.updatePartner({ _id: id }, { ...body });
  res.send({ success: true, message: 'details updated successfully!!!' });
});

const getPartnerList = catchAsync(async (req, res) => {
  const partnerDetails = await partnerService.getPartnerList();
  res.send(partnerDetails);
});

const getPartner = catchAsync(async (req, res) => {
  const partnerDetails = await partnerService.getPartner();
  res.send(partnerDetails);
});

function checkActivityFilters(filters, { activityTs, earnAmount }) {
  return filters.every(filter => {
    const { operator, field, value } = filter;
    const fieldValue = getActivityFieldValue(field, { activityTs, earnAmount });
    return evaluateCondition(fieldValue, operator, value);
  });
}


function checkItemFilters(filters, items) {
  // console.error("Items is not an array:", items);
  return items.every(item => filters.every(filter => {
    const { operator, field, value } = filter;
    const fieldValue = getItemFieldValue(field, item);
    return evaluateCondition(fieldValue, operator, value);
  }));
}


function evaluateCondition(fieldValue, operator, value) {
  switch (operator) {
    case 'equal_to': return fieldValue == value;
    case 'greater_than': return fieldValue > value;
    case 'less_than': return fieldValue < value;
    case 'greater_than_equal_to': return fieldValue >= value
    case 'less_than_equal_to': return fieldValue <= value
    default: return false;
  }
}

// Get field value from activity filter
function getActivityFieldValue(field, { activityTs, earnAmount }) {
  switch (field) {
    case 'earnAmount': return earnAmount;
    case 'activityDay': let activityNewDay = new Date(activityTs).getDate();
      return activityNewDay;
    case 'activityMonth': let activityNewMonth = new Date(activityTs).getMonth() + 1;
      switch(activityNewMonth) {
        case 1 :
          activityNewMonth = "January";
          break;
        case 2 :  
          activityNewMonth = "February";
          break;
        case 3 :  
          activityNewMonth = "March";
          break;
        case 4 :  
          activityNewMonth = "April";
          break;
        case 5 :  
          activityNewMonth = "May";
          break;
        case 6 :  
          activityNewMonth = "June";
          break;
        case 7 :  
          activityNewMonth = "July";
          break;
        case 8 :  
          activityNewMonth = "August"; 
          break;
        case 9 :  
          activityNewMonth = "Septmber";
          break;
        case 10 :  
          activityNewMonth = "October";
          break;
        case 11 :  
          activityNewMonth = "November";
          break;
        case 12 :  
          activityNewMonth = "December";
          break;
      }
      console.log(activityNewMonth);
      return activityNewMonth;
    case 'activityYear': let activityNewYear = new Date(activityTs).getFullYear();
      console.log("activityNewYear :",activityNewYear);
      return activityNewYear;
    default: return null;
  }
}

// Get field value from item
function getItemFieldValue(field, item) {
  switch (field) {
    case 'itemId': return item.itemId;
    case 'category': return item.category;
    case 'amount': return item.amount;
    case 'units': return item.units;
    default: return null;
  }
}

function calculatePoints(rule, earnAmount) {
  return rule.amountOfPoints.allocationType === "percent" 
  ? (earnAmount * rule.amountOfPoints.percentageOfAmount) / 100 // Example: calculate percentage points
  : rule.amountOfPoints.points; 
}

const earnTransaction = catchAsync(async (req, res) => {
  const { mobileNumber, activityTs, activityCode, actualPurchaseAmount, partnerTransactionId, items, modeOfPayments } = req.body;
  let { earnAmount } = req.body;
  const partnerId = req.params.id;
  try {
    const partnerDetails = await partnerService.getPartner({_id: partnerId});
    if (!partnerDetails) {
      return res.status(404).send('Partner not found');
    }

    const mobileNumberRegex = /^[6-9]\d{9}$/;

    if (!mobileNumberRegex.test(mobileNumber)) {
      return res.status(400).send({ message: "Invalid mobile number format" });
    }

    let memberDetails = await memberService.getMember({ mobileNumber : mobileNumber });
    if (!memberDetails) {
      const _id = 'user_'+v4();
      memberDetails = await memberService.addMember({_id, mobileNumber});
    }

    const itemTotalAmount = items.reduce((total, item) => {
      return total + item.amount; //later will check for reward per unit flag
    }, 0);

    const totalMopAmount = modeOfPayments.reduce((total, mop) => {
      return total + mop.amount;
    }, 0);

    if(actualPurchaseAmount != itemTotalAmount)
       return res.status(400).send({ message: 'Total item amount should be equal to earn amount'});
    if(actualPurchaseAmount != totalMopAmount)
      return res.status(400).send({ message: 'Total MOP amount should be equal to earn amount'});

    const transactionType = "earn"
    const existingTransaction = await transactionService.getTransaction({
      partnerTransactionId,
      mobileNumber,
      transactionType: transactionType,
      partnerId
    });
    
    if (existingTransaction!=null) {
      // console.log("Existing earn :",existingTransaction);
      return res.status(400).send({ message: 'Duplicate partnerTransactionId' });
    }

    const excludedMopAmount = modeOfPayments.reduce((total, mop) => {
      if(partnerDetails.mopsExcludedFromEarnAmount && partnerDetails.mopsExcludedFromEarnAmount.includes(mop.code)){
        return total + mop.amount;
      }
      return total;
    }, 0);
    earnAmount -= excludedMopAmount;

    // Fetch rules associated with the partner
    const rules = await ruleService.getRule({ partnerId });
    let applicableRules = [];

    for (const rule of rules) {
      let isActivityMatch = false;
      let isItemMatch = false;

      if(rule.activityCode != activityCode)
        continue;
      if(rule.activityFilters.length>0){
        isActivityMatch = checkActivityFilters(rule.activityFilters, { earnAmount, activityTs });
      }

      if(rule.itemFilters.length>0){
        // console.log(items);
        isItemMatch = checkItemFilters(rule.itemFilters, items);
      }

      if (isActivityMatch && isItemMatch) {
        applicableRules.push(rule);
      } else if (isActivityMatch) {
        applicableRules.push(rule);
      } else if (isItemMatch) {
        applicableRules.push(rule);
      }
    }

    // console.log("Applicable Rules :", applicableRules);
    
    const bestRule = applicableRules.reduce((max, rule) => {
      const points = calculatePoints(rule, earnAmount);
      return points > max.points ? { rule, points } : max;
    }, { points: 0 }).rule;

    // console.log("Best Rule :", bestRule);
    if (!bestRule) {
      return res.status(400).send({ message: 'No applicable rule found for this transaction' });
    }

    const pointsCalculation = calculatePoints(bestRule, earnAmount);//(applicableRule, earnAmount);
    const transactionDetails = {
      mobileNumber: mobileNumber,
      partnerId,        
      earnAmount,
      activityTs: new Date(activityTs),
      activityCode,
      actualPurchaseAmount,
      partnerTransactionId,
      items,
      modeOfPayments,
      transactionType,
      pointsEarned : pointsCalculation,
      ruleCode: bestRule.ruleCode
    };
    const trResult = await transactionService.addTransaction(transactionDetails);
    memberDetails.balance += pointsCalculation;
    if (!memberDetails.transactions) {
      memberDetails.transactions = [];
    }
    if (!partnerDetails.transactions) {
      partnerDetails.transactions = [];
    }
    memberDetails.transactions.push(trResult._id);
    partnerDetails.transactions.push(trResult._id);
    await memberService.updateMember({ _id: memberDetails._id }, { balance: memberDetails.balance, transactions: memberDetails.transactions,  });
    await partnerService.updatePartner({_id: partnerId},{transactions: partnerDetails.transactions,} )  ;  
    res.status(201).send({ message: 'Earn Transaction recorded', trResult });
  } catch (error) {
    res.status(500).send(error.message);
    console.log(error);
  }
});

const redeemTransaction = catchAsync( async (req, res) => {
  const { mobileNumber, activityCode, partnerTransactionId, pointsRedeemed, activityTs, actualPurchaseAmount, items} = req.body;
  const partnerId = req.params.id;
  try{
    const partnerDetails = await partnerService.getPartner({_id: partnerId});
    if (!partnerDetails) {
      return res.status(404).send('Partner not found');
    }
    let memberDetails = await memberService.getMember({ mobileNumber : mobileNumber });
    const transactionType = "redeem"
    const existingTransaction = await transactionService.getTransaction({
      partnerTransactionId,
      mobileNumber,
      transactionType: transactionType,
      partnerId
    });
    if (existingTransaction!=null) {
      return res.status(400).send({ message: 'Duplicate partnerTransactionId' });
    }
    if(pointsRedeemed<=0.01)
    {
      return res.status(400).send({message: 'pointsRedeemed should be greater than 0.01'})
    }
    const transactionDetails = {
      mobileNumber: mobileNumber,
      partnerId,
      activityTs: new Date(activityTs),
      activityCode,
      actualPurchaseAmount,
      partnerTransactionId,
      items,
      transactionType
    };
    const trResult = await transactionService.addTransaction(transactionDetails);

    memberDetails.balance -= pointsRedeemed;
    if (!memberDetails.transactions) {
      memberDetails.transactions = [];
    }
    memberDetails.transactions.push(trResult._id);
    await memberService.updateMember({ _id: memberDetails._id }, { balance: memberDetails.balance, transactions: memberDetails.transactions });    
    res.status(201).send({ message: 'Redeem Transaction recorded', trResult });
  }
  catch(error) {
    res.status(500).send(error.message);
    console.log(error);
  }
});

const revertTransaction = catchAsync(async (req, res) => {
  const partnerId = req.params.id;
  const {mobileNumber, earnTransactionId, partnerTransactionId, returnedItems, returnedAmount, modeOfPayments, activityTs, activityCode, actualPurchaseAmount} = req.body;
  
  try{
    const partnerDetails = await partnerService.getPartner({_id: partnerId});
    if (!partnerDetails) {
      return res.status(404).send('Partner not found');
    }

    let memberDetails = await memberService.getMember({ mobileNumber });
    if (!memberDetails) {
      return res.status(404).send('Member not found');
    }

    const transactionType = "revert";
    const existingTransaction = await transactionService.getTransaction({
      partnerTransactionId,
      mobileNumber,
      transactionType,
      partnerId
    });
    if (existingTransaction != null) {
      return res.status(400).send({ message: 'Duplicate partnerTransactionId' });
    }

    const existingEarnTransaction = await transactionService.getTransaction({
      partnerTransactionId: earnTransactionId,
      mobileNumber,
      transactionType: "earn",
      partnerId
    });
    if (!existingEarnTransaction) {
      return res.status(400).send({ message: `No earn transaction found with ${earnTransactionId}` });
    }

    let totalReturnedAmount = existingEarnTransaction.totalReturnedAmount || 0;
    let totalReturnedPoints = existingEarnTransaction.totalReturnedPoints || 0;

    if ((totalReturnedAmount + returnedAmount) > existingEarnTransaction.earnAmount) {
      return res.status(400).send({ message: 'Returned amount exceeds the original transaction amount' });
    }

    const ruleCode = existingEarnTransaction.ruleCode;
    const ruleDetails = await ruleService.getRule({
      ruleCode,
      partnerId
    });
    if (!ruleDetails || ruleDetails.length === 0) {
      return res.status(400).send({ message: 'Rule not found' });
    }

    const rulePercentage = ruleDetails[0].amountOfPoints.percentageOfAmount;

    const newEarnAmount = existingEarnTransaction.earnAmount - (totalReturnedAmount + returnedAmount);
    const newEarnedPoints = (newEarnAmount * rulePercentage) / 100;
    const remainingEarnedPoints = existingEarnTransaction.pointsEarned - totalReturnedPoints;

    let pointsToRevert = remainingEarnedPoints - newEarnedPoints;
    pointsToRevert = Math.min(pointsToRevert, remainingEarnedPoints);

    if (pointsToRevert < 0) {
      pointsToRevert = 0;
    }

    totalReturnedAmount += returnedAmount;
    totalReturnedPoints += pointsToRevert;

    const transactionDetails = {
      mobileNumber,
      partnerId,
      earnTransactionId,
      activityTs: new Date(activityTs),
      activityCode,
      actualPurchaseAmount,
      partnerTransactionId,
      returnedItems,
      transactionType,
      returnedAmount,
      modeOfPayments,
      totalReturnedAmount,
      totalReturnedPoints,
      pointsReverted: pointsToRevert
    };

    const trResult = await transactionService.addTransaction(transactionDetails);

    memberDetails.balance -= pointsToRevert;
    if (memberDetails.balance < 0) memberDetails.balance = 0;
    if (!memberDetails.transactions) {
      memberDetails.transactions = [];
    }
    memberDetails.transactions.push(trResult._id);

    existingEarnTransaction.totalReturnedAmount = totalReturnedAmount;
    existingEarnTransaction.totalReturnedPoints = totalReturnedPoints;

    await transactionService.updateTransaction(
      { _id: existingEarnTransaction._id },
      {
        totalReturnedAmount,
        totalReturnedPoints
      }
    );

    await memberService.updateMember({ _id: memberDetails._id }, { balance: memberDetails.balance, transactions: memberDetails.transactions });

    res.status(201).send({ message: 'Revert Transaction recorded', trResult });
  }
  catch (error) {
    res.status(500).send(error.message);
    console.log(error);
  }
});

const addBaseRule = catchAsync( async(req, res) => {
  const partnerId = req.params.id;
  const {ruleCode, ruleDisplayText, mobileNumber, activityTs, activityCode, userFilters, activityFilters, itemFilters, validity, amountOfPoints, expiration, isRewardPerUnit, isActive} = req.body;
  const ruleType = 'baseRule';
  const existingRule = await ruleService.getRule({ruleCode});
  // console.log("existing Rule :", existingRule);
  if(existingRule.length>0)
  {
    return res.status(400).send({message: "Rule with same code exist"});
  }
  try{
    const partnerDetails = await partnerService.getPartner({_id: partnerId});
    const addRule = {
      mobileNumber,
      ruleType,
      partnerId,
      ruleCode, 
      ruleDisplayText, 
      activityTs, 
      activityCode, 
      userFilters, 
      activityFilters, 
      itemFilters, 
      validity, 
      amountOfPoints, 
      expiration, 
      isRewardPerUnit, 
      isActive
    };
    const addRuleResult = await ruleService.addBaseRule(addRule);
    const ruleDetails = {
      _id: addRuleResult._id,
      ruleType,
      ruleCode
    }
    if(!partnerDetails.ruleDetails){
      partnerDetails.ruleDetails = [];
    }
    partnerDetails.ruleDetails.push(ruleDetails);
    const ifError = await partnerService.updatePartner({_id: partnerId},{$push :{ruleDetails:ruleDetails }});
    res.status(201).send({ message: 'Rule Added Successfully', addRuleResult });
  }
  catch(error){
    res.status(500).send(error.message);
    console.log(error);
  }
});

const getTransactions = catchAsync( async(req, res) => {
  const partnerId = req.params.id;
  try{
    const partnerDetails = await partnerService.getPartner({ _id : partnerId });
      if (!partnerDetails) {
        return res.status(404).send({ message: "Partner not found" });
      }
      const partnerTransactionsList = partnerDetails.transactions;
      const transactionsDetails = [];
      for (let item of partnerTransactionsList) {
        const itemDetails = await transactionService.getTransaction({ _id: item }); 
        if (itemDetails) {
          transactionsDetails.push(itemDetails);
        }
      }
      res.status(200).send({ transactionsDetails });
  }catch(error){
    console.log(error);
    res.status(500).send(error.message);
  }
});

module.exports = {
  getPartnerList,
  createPartner,
  updatePartner,
  getPartner,
  earnTransaction,
  redeemTransaction,
  revertTransaction,
  addBaseRule,
  getTransactions
};
