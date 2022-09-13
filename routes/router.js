const path = require('path');

const express = require('express');

const staffController = require('../controllers/staff');

const router = express.Router();

router.get('/', staffController.getRollCall); //Router hiển thị trang điểm danh

router.post('/startWork', staffController.postRollCall); //Router checkin

router.post('/endWork', staffController.postStopWork); //Router checkout

router.post('/annualLeave', staffController.postAnnualLeave);   //Router xin nghỉ

router.get('/information', staffController.getInformation); //Router hiển thị trang thông tin cá nhân

router.get('/work-history', staffController.getWorkHistory);    //Router hiển thị trang lịch sử làm việc

router.post('/work-history/', staffController.postMonthWorkHistory);    //Router chọn tháng lương hiển thị (trang lịch sử làm việc)

router.get('/covid-info', staffController.getCovidInfo);    //Router hiển thị trang đăng ký thông tin covid

router.post('/covid-temperature', staffController.postCovidTemperature);    //Router đăng ký thân nhiệt

router.post('/covid-vaccine', staffController.postCovidVaccine);    //Router đăng ký thông tin tiêm vaccine

router.post('/covid-status', staffController.postCovidStatus);  //Router đăng ký tình trạng covid

router.post('/editImage', staffController.postImageUrl);    //Router sửa ảnh

module.exports = router;