let storage = storages.create("外快大合集");
let minTime = storage.get("最短时长", 5);
let maxTime = storage.get("最长时长", 15);
var screenStartX = storage.get("startX", device.width / 2);
var screenStartY = storage.get("startY", 0.2);
var screenEndX = storage.get("endX", device.width / 2);
var screenEndY = storage.get("endY", 0.8);
var screenDuration = storage.get("screenDuration", 500);  //滑动屏幕延时 毫秒
var see_count = storage.get("喜刷刷视频数量", 50);
var runFlag = false;
var one = random(950, 1050);

/**
 * 主任务
 */
function runXiShuaShuaTask() {
    try {
        //检查无障碍
        auto.waitFor();
        //1.打开app
        if (app.launchPackage('com.zslm.xishuashua') == false) {
            throw '喜刷刷短视频APP不存在'
        }
        countdown(3 * one)
        if (id('com.byted.pangle:id/tt_splash_skip_btn').findOne(one * 8)) {
            id('com.byted.pangle:id/tt_splash_skip_btn').findOne().click()
            toast('跳过开屏广告')
        }

        //2. 刷视频任务
        runFlag = true;
        watchDog()
        for (var i = 0; i < see_count; i++) {
            countdown(random(minTime * 1000, maxTime * 1000))
            slide()
            log('滑动视频' + i)
            //是否有待领取的福袋
            if (id('com.zslm.xishuashua:id/hint_icon_gif').exists()) {
                单击(id('com.zslm.xishuashua:id/hint_icon_gif').findOne().bounds())
                log('点击福袋')
                if (id('com.zslm.xishuashua:id/iv_cancel').findOne(one * 10)) {
                    id('com.zslm.xishuashua:id/iv_cancel').findOne().click()
                    log('关闭')
                }
            }
            sleep(one / 2)
            if (text('残忍离开').exists()) {
                click('残忍离开')
                log('残忍离开')
            }
        }
        runFlag = false;

        //3. 领取视频任务奖励
        //点击钱袋
        sleep(one)
        click('钱袋')
        sleep(one / 2)
        click('钱袋')
        toast('点击钱袋')
        //下滑
        slide()
        toast('下滑')
        //领取
        var get = textStartsWith("领取").findOne(one);
        if (get) {
            get.click()
            //看广告
            countdown(one * 50)
            if (className('android.widget.ImageView').findOne(one * 5)) {
                className('android.widget.ImageView').findOne().click()
            } else {
                throw '看广告失败'
            }
            if (id('com.zslm.xishuashua:id/iv_cancel').findOne(one * 10)) {
                id('com.zslm.xishuashua:id/iv_cancel').findOne().click()
                log('关闭')
            } else {
                throw '关闭奖励弹窗失败1';
            }
        }

        // 4.看广告领金币
        sleep(one)
        for (var i = 0; i < 12; i++) {
            log(i + '次循环')
            if (textStartsWith("看广告领金币").findOne(3 * one)) {
                var el = textStartsWith("看广告领金币").findOne().text();
                if (el.substr(7, 1) == 1 && el.substr(8, 1) == 0) {
                    break;
                }
                if (text('领金币').exists()) {
                    click('领金币')
                    toast('领金币')
                    //读广告
                    countdown(50 * 1000)
                    //点击右上角x
                    id("com.byted.pangle:id/tt_video_ad_close_layout").findOne().click();
                    //点击放入荷包
                    sleep(one)
                    if (text('放入荷包').exists()) {
                        click('放入荷包')
                    }
                    //30秒后再次领取
                    if (el.substr(7, 1) != 9) {
                        sleep(one)
                        countdown(30 * one)
                    } else {
                        toast('看广告领金币任务完成')
                        break;
                    }
                }
            }

        }

        //打卡
        sleep(one)
        slide(1)
        var card = id('com.zslm.xishuashua:id/tv_title_clock').findOne(one * 2).text();
        if (card == '已领取') {
            log('已经打过卡')
        }
        if (card == '去打卡') {
            click('去打卡')
            log('打卡')
            if (id('com.zslm.xishuashua:id/iv_cancel').findOne(one * 10)) {
                id('com.zslm.xishuashua:id/iv_cancel').findOne().click()
                log('关闭')
            } else {
                throw '关闭奖励弹窗失败2';
            }
        }
        toast('任务完成。。。。。。。。')
    } catch (e) {
        runFlag = false;
        log(e)
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
                    var ad = id('com.zslm.xishuashua:id/ksad_kwad_web_navi_close').exists()
                    if (ad) {
                        ad.click();
                        log('WatchDog：关闭广告')
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

function 单击(bound) {
    x1 = bound.centerX();
    y1 = bound.centerY();
    var x = random(x1 - 3, x1 + 3);
    var y = random(y1 - 3, y1 + 3);
    console.log("\n" + "前坐标：" + x1 + "," + y1 + "\n" + "后坐标：" + x + "," + y);
    sleep(50);
    press(Number(x), Number(y), 50);
    sleep(400);
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
    var swipeHeight = device.height;
    if (up) {
        var qy = screenStartY * swipeHeight;
        var zy = screenEndY * swipeHeight;
    } else {
        var qy = screenEndY * swipeHeight;
        var zy = screenStartY * swipeHeight;
    }
    var zx = screenEndX;
    var qx = screenStartX;
    var time = screenDuration;


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

var xiShuaShuaTask={};
xiShuaShuaTask.runXiShuaShuaTask=()=>runXiShuaShuaTask();
module.exports = xiShuaShuaTask;