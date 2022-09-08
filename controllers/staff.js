const Staff = require('../model/staff');
const WorkSession = require('../model/work-session');
const AnnualLeave = require('../model/annualLeave');
const Covid = require('../model/covid');

exports.getRollCall = (req, res, next) => {
    Staff.findOne().populate(['sessions']).populate(['annualLeave'])    //Trả về staff và session, annualLeave tương ứng với staff
        .then(staff => {
            res.render('app/roll-call', {
                staff: staff,
                workSessions: staff.sessions,
                pageTitle: 'Điểm Danh',
                path: '/',
            });
        })
        .catch(err => {
            console.log(err);
        });
};

exports.postRollCall = (req, res, next) => {       //Post checkin

const workplace = req.body.workplace;
const current = new Date();
const month = current.getMonth() + 1;
const day = current.getDate();
const startTime = current;
const status = req.body.status;
const length = req.staff.sessions.length - 1;                 // Index của work session mới nhất

WorkSession.findById(req.staff.sessions[length])
    .then(session => {
        if (session !== null) {                               // Check xem có work session chưa
            if (session.day == day) {                         // Check xem work session đã sang ngày mới chưa
                session.items.push({                          // Push vào work session gần đây nhất
                    startTime: startTime,
                    workplace: workplace,
                })

                req.staff.changeStatus(status);               // Thay đổi status của staff

                session.save()
                    .then(result => {
                        res.redirect('/')
                    })
                    .catch(err => console.log(err));
            } else {
                const session = new WorkSession({             // Tạo mới khi đã sang ngày mới
                    day: day,
                    month: month,
                    items: [
                        {
                            startTime: startTime,
                            workplace: workplace,
                        }
                    ],
                    totalHrs: 0,
                    overTime: 0,
                    staffId: req.staff,
                    isApproved: false,
                })

                req.staff.addToSession(status, session);    // Thay đổi status và push sessionId vào staff

                session.save()
                    .then(result => {
                        res.redirect('/')
                    })
                    .catch(err => console.log(err));
            }
        } else {
            const session = new WorkSession({                  // Tạo mới khi chưa có work session
                day: day,
                month: month,
                items: [
                    {
                        startTime: startTime,
                        workplace: workplace,
                    }
                ],
                totalHrs: 0,
                overTime: 0,
                staffId: req.staff,
                isApproved: false,
            })

            req.staff.addToSession(status, session);        // Thay đổi status và push sessionId vào staff

            session.save()
                .then(result => {
                    res.redirect('/')
                })
                .catch(err => console.log(err));
        }
    })
    .catch(err => console.log(err))   
};

exports.postStopWork = (req, res, next) => {        //Post checkout

const current = new Date;
const stopTime = current;

const status = req.body.status;

req.staff.changeStatus(status);

const length = req.staff.sessions.length - 1;          //Index của session cuối cùng được tạo mới
const sessionId = req.staff.sessions[length];          //Lấy ID

WorkSession.findById(sessionId).then(session => {                                                   //Update item cuối cùng của worksession cuối cùng (phiên làm việc cuối cùng)
    const itemsLength = session.items.length - 1;
    const hours = (stopTime.getTime() - session.items[itemsLength].startTime.getTime())/3600000;    //Thời gian làm ca này (chia 3600000 để quy đổi mili giây ra giờ)
    session.items[itemsLength].stopTime = stopTime;
    session.items[itemsLength].hours = hours;
    session.totalHrs += hours;

    if (session.totalHrs >= 8) {                                                // Thời gian làm việc lớn hơn 8 thì tính là thời gian làm thêm
        session.overTime = session.totalHrs - 8;
    }

    session.save()
        .then(result => {
            res.redirect('/');
        })
        .catch(err => console.log(err));
});
}

exports.postAnnualLeave = (req, res, next) => {     //Post xin nghỉ
    const annualLeaveDate = req.body.annualLeaveDate;
    const annualLeaveHour = req.body.annualLeaveHour;
    const reason = req.body.reason;

    const annualLeave = new AnnualLeave({
        annualLeaveDate: annualLeaveDate,
        annualLeaveHour: annualLeaveHour,
        reason: reason,
        staffId: req.staff,
    })

    req.staff.addToLeave(annualLeave);          //Push id annualLeave vào staff

    annualLeave
        .save()
        .then(result => {
            res.redirect('/');
        })
        .catch(err => console.log(err))
}

exports.getInformation = (req, res, next) => {      //Hiển thị thông tin cá nhân
    Staff.findOne().populate(['annualLeave'])
        .then(staff => {
            res.render('app/information', {
                staff: staff,
                pageTitle: 'My Information',
                path: '/information' 
            }); 
        })
        .catch(err => console.log(err));
};

exports.getWorkHistory = (req, res, next) => {                          //Hiển thị lịch sử làm việc
    const dayNow = new Date();                                          //Mặc định tháng hiển thị lương là tháng hiện tại
    const month = dayNow.getMonth() + 1;

    Staff.findOne()
        .populate(['sessions'])
        .populate(['annualLeave'])
        .then(staff => {
                        let totalHrsMonth = 0;
                        let overTimeMonth = 0;
                        let totalTimeShort = 0;
                        staff.sessions.forEach(session => {
                            if(session.month == month) {
                                if (session.totalHrs < 8) {                                 //Thời gian làm cả ngày ít hơn 8 thì tính thời gian thiếu
                                    totalTimeShort += (8 - session.totalHrs);
                                }
                                totalHrsMonth += session.totalHrs;
                                overTimeMonth += session.overTime;
                            }
                        })
                        res.render('app/work-history', {
                            staff: staff,
                            sessions: staff.sessions,
                            pageTitle: 'Work History',
                            path:'/work-history',
                            month: month,
                            totalHrsMonth: totalHrsMonth,
                            overTimeMonth: overTimeMonth,
                            totalTimeShort: totalTimeShort,
                        });
                    })
                .catch(err => console.log(err))
};

exports.postMonthWorkHistory = (req, res, next) => {            //Chọn tháng hiển thị lương
    const month = req.body.month;                               //Lấy tháng đã chọn

    Staff.findOne()
        .populate(['sessions'])
        .populate(['annualLeave'])
        .then(staff => {                                        //Render lại work history với tháng đã chọn
                        let totalHrsMonth = 0;
                        let overTimeMonth = 0;
                        let totalTimeShort = 0;
                        staff.sessions.forEach(session => {
                            if(session.month == month) {
                                if (session.totalHrs < 8) {
                                    totalTimeShort += (8 - session.totalHrs);
                                }
                                totalHrsMonth += session.totalHrs;
                                overTimeMonth += session.overTime;
                            }
                        })
                        res.render('app/work-history', {
                            staff: staff,
                            sessions: staff.sessions,
                            pageTitle: 'Work History',
                            path:'/work-history',
                            month: month,
                            totalHrsMonth: totalHrsMonth,
                            overTimeMonth: overTimeMonth,
                            totalTimeShort: totalTimeShort,
                        });
                    })
                .catch(err => console.log(err))
}

exports.getCovidInfo = (req, res, next) => {        //Hiển thị view covid
            res.render('app/covid-info', {
                pageTitle: 'Covid Information',
                path:'/covid-info'
            });
};

exports.postImageUrl = (req, res, next) => {
    const imageUrl = req.body.imageUrl;
    Staff.findOne().then(staff => {
        staff.imageUrl = imageUrl;
        return staff.save()
            .then(result => {
                res.redirect('/information')
            })
            .catch(err => console.log(err));
    })
}

exports.postCovidTemperature = (req, res, next) => {    //Post thân nhiệt
    const temperature = req.body.temperature;
    const date = req.body.date;
    Covid.findOne().then(covid => {
        covid.dailyInfo.items.push({
            temperature: temperature,
            date: date
        });
        covid.save();
        res.redirect('/covid-info')
    })
}

exports.postCovidVaccine = (req, res, next) => {    //Post Vaccine
    const vaccineType1 = req.body.vaccineType1;
    const vaccineDate1 = req.body.vaccineDate1;
    const vaccineType2 = req.body.vaccineType2;
    const vaccineDate2 = req.body.vaccineDate2;
    Covid.findOne().then(covid => {
        covid.vaccineDate1 = vaccineDate1;
        covid.vaccineType1 = vaccineType1;
        covid.vaccineDate2 = vaccineDate2;
        covid.vaccineType2 = vaccineType2;
        covid.save();
        res.redirect('/covid-info')
    })
}

exports.postCovidStatus = (req, res, next) => {    //Post Vaccine
    const covidStatus = req.body.covidStatus;
    Covid.findOne().then(covid => {
        covid.covidStatus = covidStatus;
        covid.save();
        res.redirect('/covid-info')
    })
}