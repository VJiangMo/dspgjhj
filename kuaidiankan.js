let storage = storages.create("快点看_短视频合集");
let minTime = storage.get("最短时长", 1);
let maxTime = storage.get("最长时长", 3);
var screenStartX = storage.get("startX", device.width / 2);
var screenStartY = storage.get("startY", 0.2);
var screenEndX = storage.get("endX", device.width / 2);
var screenEndY = storage.get("endY", 0.8);
var screenDuration = storage.get("screenDuration", 500);  //滑动屏幕延时 毫秒
var see_count = storage.get("快点看文章数量", 50);
var runFlag = false;
var one = random(950, 1050);

/**
 * 主任务
 */
runMain()
function runMain() {
    try {
        //检查无障碍
        auto.waitFor();
        toast('启动快点看APP')
        // 1.打开app
        if (app.launchPackage('com.yuncheapp.android.pearl') == false) {
            throw '快点看APP不存在'
        }
        runFlag = true
        watchDog()
        var logo = id('logo_view').findOne(one * 5);
        if (logo == false) {
            throw '启动失败'
        }
        sleep(one)
        //2.看文章
        for (var j = 0; j < see_count; j++) {
            log('第' + j + '篇文章')
            var title = id('com.yuncheapp.android.pearl:id/title').findOne(one * 3)
            if (title == false) {
                log('标题未找到')
                slide()
                sleep(one)
                continue;
            }
            if(title.parent().click() == false) {
                log('点击标题失败')
                slide()
                sleep(one)
                continue;
            }
            //文章滑动coun次
            var count = random(6, 10);
            toast('滑动' + count + '次')
            for (var i = 0; i < count; i++) {
                sleep(random(minTime * 1000, maxTime * 1000))
                //领取惊喜红包
                if (id('com.yuncheapp.android.pearl:id/reward_button').exists()) {
                    if (id('com.yuncheapp.android.pearl:id/reward_button').findOne().text() == '点击领取') {
                        click('领取金币')
                        toast('发现惊喜红包')
                        if (id('com.yuncheapp.android.pearl:id/close').findOne(one * 3)) {
                            id('com.yuncheapp.android.pearl:id/close').findOne().click()
                            log('关闭领取金币弹窗')
                            sleep(one)
                        }
                    }
                }
                //滑动
                slide()
            }
            sleep(one)
            back()
            //20/1概率刷新页面
            sleep(one)
            if (random(1, 20) == 1) {
                toast('刷新页面')
                logo.click()
                sleep(one * 5)
            } else {
                slide()
            }
            sleep(one)
        }
        toast('看文章结束')

        //3.签到
        slide()
        if (text('去签到')) {
            click('去签到')
            log('点击去签到1')
        } else {
            sleep(one / 2)
            slide()
            if (text('去签到')) {
                click('去签到')
                log('点击去签到2')
            }
        }
        //确认签到
        var sign = text('立即签到').findOne(one * 3);
        if (sign) {
            sign.click()
            log('点击签到')
            back()
        }
        sleep(one)
        toast('任务完成')
        runFlag = false;

    } catch (e) {
        runFlag = false
        console.log(e)
        toast(e)
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

