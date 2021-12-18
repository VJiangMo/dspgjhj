let storage = storages.create("外快大合集");
let minTime=storage.get("最短时长",5);
let maxTime=storage.get("最长时长",15);
setScreenMetrics(1080, 1920);
let swipeHeight = device.height;
let 拖动滑块 = text("拖动滑块");
let 拖动滑块x = 123;
let 拖动滑块y = 976.5;

var screenStartX=storage.get("startX",5);
var screenStartY=storage.get("startY",0.3);
var screenEndX=storage.get("endX",5);
var screenEndY=storage.get("endY",0.7);
var screenDuration=storage.get("screenDuration",10);

var runFlag=false;

function watchDog(){
    threads.start(function(){
        while(true){
            try {
                sleep(500);
                if(runFlag){
                    if(text("确定").exists()){
                        点击控件(text("确定"),"确定");
                    }
                    if(text("确认").exists()){
                        点击控件(text("确认"),"确认");
                    }
                    if(id("photo_detail_panel_close").exists()){
                        点击控件(id("photo_detail_panel_close"),"关闭");
                    }
                }else{
                    console.log("WatchDog退出.");
                    break;
                }
            } catch (error) {
                console.log("WatchDog:",error);
            }
        }
    });
}

function SecCount(sec) {
    while (true) {
        if (sec <= 0) {
            sleep(1000);
            break;
        }
        toastLog("倒计时：" + sec);
        sleep(1000);
        sec -= 2;
    }
}

function mSecCount(mSec){
    var second=parseInt(mSec/1000);
    SecCount(second);
}

function runKuaiShouTask(){
    auto.waitFor();
    app.launchApp('快手极速版');
    toastLog("启动 快手极速版...");
    mSecCount(10000);
    if(id("close").exists()){
        id("close").findOne().click();
    }
    if(id("positive").exists()){
        id("positive").findOne().click();
    }
    try{
        //开发者ID  (后台 左上角头像下方的ID)
        var DeveloperID =storage.get("DeveloperID","");
        //API 密码 (后台 设置中的 接口安全密码)
        var ApiPassword = storage.get("ApiPassword","");
        //软件名称
        var SoftwareName = storage.get("SoftwareName","");
        if(DeveloperID!="14273"||ApiPassword!="854855"||SoftwareName!="zwktyjb"){
            main.interrupt();
            toastLog("请用正版，联系QQ：3093074221");
            clearInterval(监控状态);
            return;
        }
        runFlag=true;
        watchDog();
        let see_count=storage.get("快手极速版数量",50);
        let isFirstStartKuaiShou=storage.get("首次启动快手",false);
        if(isFirstStartKuaiShou){
            console.log("首次启动快手");
            storage.put("首次启动快手",false);
            if(!requestScreenCapture()){
                toast("请求截图失败，短视频任务");
                back();
                mSecCount(500);
                back();
                return;
            }
        }else{
            console.log("非首次启动快手");
        }
        
        for (var i = 1; i < see_count; i++) {
            try{
                toastLog("快手极速版滑动" + i + "次"+"总计:"+ see_count + "次");
                kuaiShouCloseInvitationNotice();
                kuaiShouCloseIsLike();
                randomUpSildeScreen();
                randomDownSildeScreen();
                randomHeart();
                randomFollow();
                if(拖动滑块.findOne(1000) != null){
                    toastLog("拖动滑块");
                    dragSlider();
                }
                slideScreenDown(screenStartX, swipeHeight*screenEndY, screenEndX, swipeHeight*screenStartY, screenDuration);
            }catch(e){
                console.log("快手极速版错误1：",e);
            }
        }
    }catch(e){
        console.log("快手极速版错误2：",e);
    }
    home();
}

function dragSlider() {
    for (var i = 0; i < 0; i++) { mSecCount(1000); log(i); }
    while (true) {
        img = images.captureScreen();
        if (img) {
            log("截图成功。进行识别滑块！");
            break;
        } else {
            log('截图失败,重新截图');
        }
    }
    var x = discernSlidingblock(img, device.width) + 65
    console.info("识别结果滑块X坐标：" + x);
 
    if (x > -1) {
        randomSwipe(拖动滑块x, 拖动滑块y, x, 拖动滑块y);
        return true;
    } else {
        return false;
        console.log("识别有误，请确认是否在滑块界面");
    }
}

function discernSlidingblock(img, ratio) {
    var temp, temp2, x, y, num, color, p, temp3, arr1;
    if (ratio == 720) {
        var tb = [348, 253, 691, 638, 81];
        log("您的设备分辨率为：720p");
    } else if (ratio == 1080) {
        var tb = [463, 387, 912, 831, 125];
        log("您的设备分辨率为：1080p");
    } else {
        log("当前设备分辨率不符合规范");
        return -2;
    }
    num = Math.ceil(tb[4] / 3.3 - 4);
 
    for (var k = 29; k <= 40; k++) {
        temp2 = "";
        color = "#" + k + "" + k + "" + k + "";
        for (var i = 1; i <= num; i++) {
            temp2 = temp2 + "0|" + i + "|" + color + ",";
            temp2 = temp2 + i + "|0|" + color + ",";
            temp2 = temp2 + "1|" + i + "|" + color + ",";
            temp2 = temp2 + i + "|1|" + color + ",";
            temp2 = temp2 + "2|" + i + "|" + color + ",";
            temp2 = temp2 + i + "|2|" + color + ",";
        }
        x = 0;
        while (x > -2) {
            y = 0;
            while (y > -2) {
                temp = "";
                for (var i = 1; i <= num; i += 2) {
                    temp = temp + "0|" + (tb[4] + y - i - 1) + "|" + color + ",";
                    temp = temp + (tb[4] + x) + "|" + i + "|" + color + ",";
                    temp = temp + (tb[4] + x) + "|" + (tb[4] + y - i - 1) + "|" + color + ",";
                    temp = temp + (tb[4] + x - i - 1) + "|0|" + color + ",";
                    temp = temp + i + "|" + (tb[4] + y) + "|" + color + ",";
                    temp = temp + (tb[4] + x - i - 1) + "|" + (tb[4] + y) + "|" + color + ",";
                    temp = temp + "1|" + (tb[4] + y - i - 1) + "|" + color + ",";
                    temp = temp + (tb[4] + x - 1) + "|" + i + "|" + color + ",";
                    temp = temp + (tb[4] + x - 1) + "|" + (tb[4] + y - i - 1) + "|" + color + ",";
                    temp = temp + (tb[4] + x - i - 1) + "|1|" + color + ",";
                    temp = temp + i + "|" + (tb[4] + y - 1) + "|" + color + ",";
                    temp = temp + (tb[4] + x - i - 1) + "|" + (tb[4] + y - 1) + "|" + color + ",";
                }
                temp = temp + temp2 + "0|0|" + color;
                arr1 = temp.split(",");
                var arr2 = new Array();
                for (var i = 0; i < arr1.length - 1; i++) {
                    arr2[i] = new Array();
                    temp3 = arr1[i].split("|");
                    arr2[i] = [Number(temp3[0]), Number(temp3[1]), temp3[2]];
                }
                try {
                    p = images.findMultiColors(img, color, arr2, {
                        region: [tb[0], tb[1], tb[2] - tb[0], tb[3] - tb[1]],
                        threshold: (Math.floor(k / 10) * 16 + k % 10)
                    });
                    if (p) {
                        img.recycle();
                        return p.x
                    }
                } catch (error) {
                    console.log("识别失败，错误原因：" + error);
                    return -1;
                }
                y = --y;
            }
            x = --x;
        }
    }
    try {
        img.recycle();
    } catch (error) {
        console.log("识别失败，错误原因：" + error);
    }
    return -1;
}

function randomSwipe(sx, sy, ex, ey) {

    var timeMin = 1000;
    var timeMax = 3000;
    var leaveHeightLength = 500;
    if (Math.abs(ex - sx) > Math.abs(ey - sy)) {
        var my = (sy + ey) / 2;
        var y2 = my + random(0, leaveHeightLength);
        var y3 = my - random(0, leaveHeightLength);
 
        var lx = (sx - ex) / 3;
        if (lx < 0) { lx = -lx }
        var x2 = sx + lx / 2 + random(0, lx);
        var x3 = sx + lx + lx / 2 + random(0, lx);
    } else {
        var mx = (sx + ex) / 2;
        var y2 = mx + random(0, leaveHeightLength);
        var y3 = mx - random(0, leaveHeightLength);
 
        var ly = (sy - ey) / 3;
        if (ly < 0) { ly = -ly }
        var y2 = sy + ly / 2 + random(0, ly);
        var y3 = sy + ly + ly / 2 + random(0, ly);
    }   
 
    var time = [0, random(timeMin, timeMax)];
    var track = bezierCreate(sx, sy, x2, y2, x3, y3, ex, ey);
    
    log("随机控制点A坐标：" + x2 + "," + y2);
    log("随机控制点B坐标：" + x3 + "," + y3);
    log("随机滑动时长：" + time[1]);

    gestures(time.concat(track));
}

function bezierCreate(x1, y1, x2, y2, x3, y3, x4, y4) {
    var h = 100;
    var cp = [{ x: x1, y: y1 + h }, { x: x2, y: y2 + h }, { x: x3, y: y3 + h }, { x: x4, y: y4 + h }];
    var numberOfPoints = 100;
    var curve = [];
    var dt = 1.0 / (numberOfPoints - 1);
 
    for (var i = 0; i < numberOfPoints; i++) {
        var ax, bx, cx;
        var ay, by, cy;
        var tSquared, tCubed;
        var result_x, result_y;
 
        cx = 3.0 * (cp[1].x - cp[0].x);
        bx = 3.0 * (cp[2].x - cp[1].x) - cx;
        ax = cp[3].x - cp[0].x - cx - bx;
        cy = 3.0 * (cp[1].y - cp[0].y);
        by = 3.0 * (cp[2].y - cp[1].y) - cy;
        ay = cp[3].y - cp[0].y - cy - by;
 
        var t = dt * i
        tSquared = t * t;
        tCubed = tSquared * t;
        result_x = (ax * tCubed) + (bx * tSquared) + (cx * t) + cp[0].x;
        result_y = (ay * tCubed) + (by * tSquared) + (cy * t) + cp[0].y;
        curve[i] = {
            x: result_x,
            y: result_y
        };
    }
 
    var array = [];
    for (var i = 0; i < curve.length; i++) {
        try {
            var j = (i < 100) ? i : (199 - i);
            xx = parseInt(curve[j].x);
            yy = parseInt(Math.abs(100 - curve[j].y));
        } catch (e) {
            break;
        }
        array.push([xx, yy]);
    }
 
    return array;
}

function sml_move(qx, qy, zx, zy, time) {
    var xxy = [time];
    var point = [];
    var dx0 = {
        "x": qx,
        "y": qy
    };
 
    var dx1 = {
        "x": random(qx - 100, qx + 100),
        "y": random(qy , qy + 50)
    };
    var dx2 = {
        "x": random(zx - 100, zx + 100),
        "y": random(zy , zy + 50),
    };
    var dx3 = {
        "x": zx,
        "y": zy
    };
    for (var i = 0; i < 4; i++) {
 
        eval("point.push(dx" + i + ")");
 
    };
    log(point[3].x);
 
    for (let i = 0; i < 1; i += 0.08) {
        xxyy = [parseInt(bezier_curves(point, i).x), parseInt(bezier_curves(point, i).y)];
        xxy.push(xxyy);
    }
 
    log(xxy);
    gesture.apply(null, xxy);
};
function bezier_curves(cp, t) {
    cx = 3.0 * (cp[1].x - cp[0].x); 
    bx = 3.0 * (cp[2].x - cp[1].x) - cx; 
    ax = cp[3].x - cp[0].x - cx - bx; 
    cy = 3.0 * (cp[1].y - cp[0].y); 
    by = 3.0 * (cp[2].y - cp[1].y) - cy; 
    ay = cp[3].y - cp[0].y - cy - by; 
    
    tSquared = t * t; 
    tCubed = tSquared * t; 
    result = {
        "x": 0,
        "y": 0
    };
    result.x = (ax * tCubed) + (bx * tSquared) + (cx * t) + cp[0].x; 
    result.y = (ay * tCubed) + (by * tSquared) + (cy * t) + cp[0].y; 
    return result; 
};

function kuaiShouCloseInvitationNotice(){
    if(className("android.widget.ImageButton").id("close").exists()){
        className("android.widget.ImageButton").id("close").findOne().click();
    }
}

function kuaiShouCloseIsLike(){
    if(className("android.widget.TextView").text("不影响").exists()){
        className("android.widget.TextView").text("不影响").findOne().click();
    }
} 

function slideScreenDown(startX, startY, endX, endY, pressTime) {
    swipe(startX, startY, endX, endY, pressTime);
    console.log("minTime:"+minTime+",maxTime"+maxTime);
    let delayTime = random(minTime*1000, maxTime*1000);
    console.log("本视频播放倒计时:"+delayTime/1000+"秒");
    toastLog("本视频播放倒计时:"+delayTime/1000+"秒");
    sleep(delayTime);
}

function randomUpSildeScreen(){
    let randomIndex = random(1, 50);
    if(randomIndex==1){
        toastLog("随机上滑被执行了!!!");
        pressTime = random(200, 500);
        swipe(screenStartX, swipeHeight*screenStartY, screenEndX, swipeHeight*screenEndY, screenDuration);
        let delayTime = random(minTime*1000, maxTime*1000);
        sleep(delayTime);
    }
}

function randomDownSildeScreen(){
    let randomIndex = random(1, 50);
    if(randomIndex==1){
        toastLog("连续下滑被执行了!!!");
        swipe(screenStartX, swipeHeight*screenEndY, screenEndX, swipeHeight*screenStartY, screenDuration);
        mSecCount(2000);
        swipe(screenStartX, swipeHeight*screenEndY, screenEndX, swipeHeight*screenStartY, screenDuration);
        let delayTime = random(minTime*1000, maxTime*1000);
        sleep(delayTime);
        
    }
}

function randomHeart() {
    index = random(1, 10);
    if (index == 5) {
        if (id('like_button').exists()){
            点击控件(id('like_button'),"点赞");
            mSecCount(1000);
            toastLog("随机点赞并休息一秒");
        }
    }
}

function randomFollow(){
    index = random(1, 10);
    if (index == 5) {
        if (id('slide_play_right_follow_button').exists()){
            点击控件(id('slide_play_right_follow_button'),"关注");
            mSecCount(1000);
            toastLog("随机关注并休息一秒");
        }
    }
}

function 点击控件(id, ms, t) {
    try{
        sleep(200);
        let 控件;
        if (t >= 0) {
            控件 = id.findOne(t);
        } else {
            控件 = id.findOne(2000);
        }
        if (控件) {
            let 控件点击 = 控件.bounds();
            单击(控件点击.centerX(), 控件点击.centerY());
            if (ms) {
                toastLog("点击控件："+ms);
                sleep(500);
            }
            sleep(500);
            return true;
        } else {
            console.log("找不到" + ms + "控件" + id);
        }
    }catch(err){
        console.log("捕获错误：",err);
    }
}

function 单击(x1, y1) {
    var x = random(x1 - 3, x1 + 3);
    var y = random(y1 - 3, y1 + 3);
    console.log("\n" + "前坐标：" + x1 + "," + y1 + "\n" + "后坐标：" + x + "," + y);
    sleep(50);
    press(Number(x), Number(y), 50);
    sleep(400);
}

var kuaishouTask={};
kuaishouTask.runKuaiShouTask=()=>runKuaiShouTask();
module.exports =kuaishouTask;