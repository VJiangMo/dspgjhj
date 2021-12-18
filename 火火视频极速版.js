let storage = storages.create("攒外快网_短视频合集");
let minTime=storage.get("最短时长",5);
let maxTime=storage.get("最长时长",15);
let swipeHeight = device.height;

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
                    if(text("取消").exists()){
                        点击点击控件(text("取消"),"取消");
                    }
                    if(id("aru").exists()){
                        点击控件(id("aru"),"返回");
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

function runHuoHuoTask(){
    auto.waitFor();
    app.launchApp('火火视频极速版');
    toastLog("启动 火火视频极速版...");
    mSecCount(12000);
    try {
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
        if(id("avq").className("android.widget.TextView").text("小视频").exists()){
            id("avq").className("android.widget.TextView").text("小视频").findOne(2000).parent().click();
        }
        SecCount(4);
        let see_count=storage.get("火火极速版数量",50);
        runFlag=true;
        watchDog();
        for (var i = 1; i < see_count; i++) {
            try{
                toastLog("火火视频滑动" + i + '次' + "总计:" + see_count + "次");
                clickGoldEgg();
                randomUpSildeScreen();
                SecCount(1);
                randomDownSildeScreen();
                SecCount(1);
                randomHeart();
                SecCount(1);
                slideScreenDown(screenStartX, swipeHeight*screenEndY, screenEndX, swipeHeight*screenStartY, screenDuration);
            }catch (e) {
                console.log("火火视频极速版错误1：",e);
            }
        }
     } catch (e) {
        console.log("火火视频极速版错误2：",e);
     }
    runFlag=false;
    home();
}

function clickGoldEgg() {
    if(text("金蛋大奖").exists()){
        点击控件(id("fz"),"砸金蛋");
    }
    SecCount(1);
    if(id("ku").exists()){
        点击控件(id("ku"),"关闭");
    }
    SecCount(1);
}

function closeReturnOrCloseButton() {
    if (className("android.widget.Button").id("a7u").exists()) {
        className("android.widget.Button").id("a7u").findOne().click();
    }
    if (className("android.widget.Button").id("a62").exists()) {
        className("android.widget.Button").id("a62u").findOne().click();
    }
    if (className("android.widget.FrameLayout").id("jh").exists()) {
        className("android.widget.FrameLayout").id("jh").findOne().click();
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

function goPlay() {
    if (goPlay = text("继续播放").exists()) {
        goPlay.click();
    };
}

function randomHeart() {
    index = random(1, 20);
    if (index == 5) {
        点击控件(className("android.widget.TextView").textContains("w"),"点赞");
    }
}

function youngWin() {
    if (youngWin = text("我知道了").exists()) {
        toastLog("点击了我知道了(青少年窗口)");
        youngWin.click();
    };
}
function qiandao(){
    try {
        let boundVideo = null;
        let bottomMenu = className("android.widget.RelativeLayout").find();
        
        toastLog(bottomMenu.length);
        for (let i = 0; i < bottomMenu.length; i++) {
            let video = bottomMenu[i].children().findOne(text("任务"));
            if (video != null) {
                toastLog(i);
                boundVideo = bottomMenu[i].bounds();
            }
        }
        if (boundVideo == null) {
            console.info("没有任务");
            let bottomMenu = className("android.widget.RelativeLayout").find();
            bottomMenu[bottomMenu.length - 1].click();
        } else {
            click(boundVideo.centerX(), boundVideo.centerY());
        }
    } catch (e) { console.error(e);}
}

function 点击控件(id, ms, t) {
    mSecCount(200)
    let 控件
    if (t >= 0) {
        控件 = id.findOne(t)
    } else {
        控件 = id.findOne(2000)
    }click
    if (控件) {
        let 控件点击 = 控件.bounds()
        单击(控件点击.centerX(), 控件点击.centerY());
        if (ms) {
            toastLog("点击控件："+ms);
            mSecCount(1000)
        }
        mSecCount(1000)
        return true
    } else {
        console.log("找不到" + ms + "控件" + id)
    }
}

function 单击(x1, y1) {
    var x = random(x1 - 3, x1 + 3)
    var y = random(y1 - 3, y1 + 3)
    console.log("\n" + "前坐标：" + x1 + "," + y1 + "\n" + "后坐标：" + x + "," + y)
    mSecCount(50)
    press(Number(x), Number(y), 50)
    mSecCount(400)
}

function 等待点击控件(id, cs) {
    let i = 0
    while (true) {
        i++
        mSecCount(500)
        if (id.visibleToUser().exists()) {
            console.log("攒外快网：控件出现")
            return true
        }
        if (i >= cs) {
            console.log("攒外快网：没等到控件出现")
            return false
        }
    }
}

var huohuoTask={};
huohuoTask.runHuoHuoTask=()=>runHuoHuoTask();
module.exports =huohuoTask;