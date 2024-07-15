const catchAsync = require('../utils/catchAsync.js');
const { partnerService } = require('../services/index.js');
const { memberService } = require('../services/index.js');
const { transactionService } = require('../services/index.js');
const member = require('../models/member.model.js');
const transaction = require('../models/transaction.model.js')
const { v4 } = require('uuid');

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


const earnTransaction = catchAsync(async (req, res) => {
  const { mobileNumber, earnAmount, activityTs, activityCode, actualPurchaseAmount, partnerTransactionId, items, modeOfPayments } = req.body;
  const partnerId = req.params.id;
  try {
    const partnerDetails = await partnerService.getPartner({_id: partnerId});
    if (!partnerDetails) {
      return res.status(404).send('Partner not found');
    }

    let memberDetails = await memberService.getMember({ mobileNumber : mobileNumber });
    if (!memberDetails) {
      const _id = 'user_'+v4();
      memberDetails = await memberService.addMember({_id, mobileNumber});
    }

    const transactionType = "earn"
    const existingTransaction = await transactionService.getTransaction({
      partnerTransactionId,
      mobileNumber,
      transactionType: transactionType,
      partnerId
    });
    
    if (existingTransaction!=null) {
      return res.status(400).send({ message: 'Duplicate partnerTransactionId' });
    }
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
      transactionType
    };
    const trResult = await transactionService.addTransaction(transactionDetails);

    memberDetails.balance += (earnAmount*0.5/100);
    if (!memberDetails.transactions) {
      memberDetails.transactions = [];
    }
    memberDetails.transactions.push(trResult._id);
    await memberService.updateMember({ _id: memberDetails._id }, { balance: memberDetails.balance, transactions: memberDetails.transactions });    
    res.status(201).send({ message: 'Transaction recorded', trResult });
  } catch (error) {
    res.status(500).send(error.message);
    console.log(error);
  }
});



module.exports = {
  getPartnerList,
  createPartner,
  updatePartner,
  getPartner,
  earnTransaction,
};
