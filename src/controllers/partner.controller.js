const catchAsync = require('../utils/catchAsync.js');
const { partnerService } = require('../services/index.js');

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

module.exports = {
  getPartnerList,
  createPartner,
  updatePartner,
};
