setScreenMetrics(1920, 1080)
let storage = storages.create("外快大合集");
let minTime = storage.get("最短时长", 5);
let maxTime = storage.get("最长时长", 15);
let swipeHeight = device.height;

var screenStartX = storage.get("startX", 5);
var screenStartY = storage.get("startY", 0.3);
var screenEndX = storage.get("endX", 5);
var screenEndY = storage.get("endY", 0.7);
var screenDuration = storage.get("screenDuration", 10);
var seeCount = storage.get("快点看文章数量", 50);
var runFlag = false;
var one = random(950, 1050);

function runKuaiKanDianTask() {
    try {
        //检查无障碍
        auto.waitFor();
        toast('启动快看点APP')
        // 1.打开app
        if (app.launchPackage('com.yuncheapp.android.pearl') == false) {
            throw '快看点APP不存在'
        }
        runFlag = true
        watchDog()
        var logo = id('logo_view').findOne(one * 5);
        if (logo == false) {
            throw '启动失败'
        }
        sleep(one)
        //2.看文章
        for (var j = 1; j <= seeCount; j++) {
            log('看第' + j + '篇文章')
            slide()
            sleep(one)
            var title = id('com.yuncheapp.android.pearl:id/title').findOne(one * 3)
            if (!title) {
                log('标题未找到')
                continue;
            }
            if (title.text() == '' ||  click(title.text()) == false) {
                log('点击标题失败')
                continue;
            }
            toastLog('点击标题')
            sleep(one)
            //判断是否为详情页面
            if(id('com.yuncheapp.android.pearl:id/anchor_comment').findOne(one * 3)) {
                toastLog('这不是文章不用滑动～')
                sleep(random(minTime * 1000, maxTime * 1000))
                back();
                sleep(one * 2)
                continue;
            }
            if (!id('com.yuncheapp.android.pearl:id/comment_layout').findOne(one * 3)) {
                toastLog('不是新闻，重新返回推荐页面')
                if (goHome() == false) {
                    throw '返回失败';
                } else {
                    continue;
                }
            }
            //文章滑动coun次
            var count = random(7, 11);
            toastLog('滑动' + count + '次')
            for (var i = 1; i <= count; i++) {
                sleep(random(minTime * 500, maxTime * 500))
                log('阅读中' + i)
                //领取惊喜红包
                if (id('com.yuncheapp.android.pearl:id/reward_button').findOne(one)) {
                    if (id('com.yuncheapp.android.pearl:id/reward_button').findOne().text() == '领取金币') {
                        click('领取金币')
                        toastLog('发现惊喜红包并领取成功')
                        sleep(one * 3)
                        if (id('com.yuncheapp.android.pearl:id/close').findOne(one * 3)) {
                            id('com.yuncheapp.android.pearl:id/close').findOne().click()
                            log('关闭惊喜红包弹窗')
                            sleep(one)
                        }
                    }
                }
                //滑动
                slide()
            }
            sleep(one)
            back()
            sleep(one)
        }
        toastLog('看文章任务结束')

        //3.签到
        sleep(one * 2)
        if (text('福利').exists() == false) {
            throw '福利入口查询失败'
        }
        click('福利')
        sleep(one)
        if (text('今日获得').exists() == false) {
            throw '进入福利中心失败'
        }
        toastLog('进入领奖页面成功')
        sleep(one * 3)
        slide()
        sleep(one)
        if (text('去签到').exists()) {
            c1 = click('去签到')
            log('点击去签到1' + c1)
        } else {
            sleep(one / 2)
            slide()
            if (text('去签到').exists()) {
                c2 = click('去签到')
                log('点击去签到2' + c2)
            }
        }
        //确认签到
        var sign = text('立即签到').findOne(one * 3);
        if (sign) {
            sign.click()
            toastLog('点击签到')
            back()
        }
        sleep(one)
        toastLog('任务完成')
        runFlag = false;

    } catch (e) {
        runFlag = false
        toastLog('脚本终止：' + e)
    }

}
/**
 * 检测广告
 */
function watchDog() {
    threads.start(function () {
        log('WatchDog：start')
        while (true) {
            try {
                sleep(500);
                if (runFlag) {
                    //是否广告
                    if (id('com.yuncheapp.android.pearl:id/iv_close').exists()) {
                        id('com.yuncheapp.android.pearl:id/iv_close').findOne().click()
                    }
                } else {
                    log("WatchDog退出.");
                    break;
                }
            } catch (error) {
                log("WatchDogError:", error);
            }
        }
    })
}

function goHome() {
    back()
    sleep(one)
    if (text('推荐').exists()) {
        click('推荐')
        sleep(one * 5)
        return true;
    } else {
        sleep(one)
        if (text('推荐').exists()) {
            click('推荐')
            toastLog('重新回到推荐页')
            sleep(one * 5)
            return true;
        }
    }

    return false;
}


/**
 * 倒计时
 * @param {毫秒} sec 
 */
function countdown(sec) {
    while (true) {
        if (sec <= 1000) {
            sleep(1000);
            break;
        }
        log("倒计时：" + sec / 1000 + "秒");
        sleep(1000);
        sec -= 1000;
    }
}

/**
 * 滑动屏幕
 * @param {*手指上滑} up 
 */
function slide(up) {
    if (up) {
        var qy = 0.2 * swipeHeight;
        var zy = 0.8 * swipeHeight;
    } else {
        var qy = 0.8 * swipeHeight;
        var zy = 0.2 * swipeHeight;
    }
    var zx = device.width / 2;
    var qx = device.width / 2;
    var time = random(500, 700);

    var xxy = [time];
    var point = [];
    var dx0 = {
        "x": qx,
        "y": qy
    };
    var dx1 = {
        "x": random(qx - 100, qx + 100),
        "y": random(qy, qy + 50)
    };
    var dx2 = {
        "x": random(zx - 100, zx + 100),
        "y": random(zy, zy + 50),
    };
    var dx3 = {
        "x": zx,
        "y": zy
    };
    for (var i = 0; i < 4; i++) {
        eval("point.push(dx" + i + ")");
    };
    for (let i = 0; i < 1; i += 0.08) {
        let newPoint = bezier_curves(point, i);
        xxyy = [parseInt(newPoint.x), parseInt(newPoint.y)]
        xxy.push(xxyy);
    }
    gesture.apply(null, xxy);
}

/**
 * 贝塞尔曲线
 * @param {坐标点} ScreenPoint 
 * @param {偏移量} Offset 
 */
function bezier_curves(ScreenPoint, Offset) {
    cx = 3.0 * (ScreenPoint[1].x - ScreenPoint[0].x);
    bx = 3.0 * (ScreenPoint[2].x - ScreenPoint[1].x) - cx;
    ax = ScreenPoint[3].x - ScreenPoint[0].x - cx - bx;
    cy = 3.0 * (ScreenPoint[1].y - ScreenPoint[0].y);
    by = 3.0 * (ScreenPoint[2].y - ScreenPoint[1].y) - cy;
    ay = ScreenPoint[3].y - ScreenPoint[0].y - cy - by;
    tSquared = Offset * Offset;
    tCubed = tSquared * Offset;
    result = {
        "x": 0,
        "y": 0
    };
    result.x = (ax * tCubed) + (bx * tSquared) + (cx * Offset) + ScreenPoint[0].x;
    result.y = (ay * tCubed) + (by * tSquared) + (cy * Offset) + ScreenPoint[0].y;
    return result;
}

var kuaiKanDianTask={};
kuaiKanDianTask.runKuaiKanDianTask=()=>runKuaiKanDianTask();
module.exports =kuaiKanDianTask;