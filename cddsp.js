let storage = storages.create("外快大合集"); 
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
                        点击控件(text("取消"),"取消");
                    }
                    if(id("close_bottom_button").exists()){
                        点击控件(id("close_bottom_button"),"关闭");
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

function runCaiDanTask(){
    auto.waitFor();
    app.launchApp('彩蛋视频');
    toastLog("启动 彩蛋视频...");
    mSecCount(8000);
    
    if(id("btn_confirm").exists()){
        id("btn_confirm").findOne().click();
    }
    if(id("iv_close").exists()){
        id("iv_close").findOne().click();
    }
   
    closeAd();

    let see_count=storage.get("彩蛋短视频数量",50);
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
        for (var i = 1; i < see_count; i++) {
            try{
                toastLog("彩蛋视频滑动" + i + "次" + "总计:" + see_count + "次");
                caiDanCloseAd();
                closeGoderEgg();
                randomUpSildeScreen();
                randomDownSildeScreen();
                randomHeart();
                randomFollow();
                slideScreenDown(screenStartX, swipeHeight*screenEndY, screenEndX, swipeHeight*screenStartY, screenDuration);
            }catch(e){
                console.log("彩蛋视频错误1：",e);
            }
        }
    }catch(e){
        console.log("彩蛋视频错误2：",e);
    }
    home();
}

function slideScreenDown(startX, startY, endX, endY, pressTime) {
    swipe(startX, startY, endX, endY, pressTime);
    console.log("minTime:"+minTime+",maxTime"+maxTime);
    let delayTime = random(minTime*1000, maxTime*1000);
    console.log("本视频播放倒计时:"+delayTime/1000+"秒");
    toastLog("本视频播放倒计时:"+delayTime/1000+"秒");
    sleep(delayTime);
}

function caiDanCloseAd() {
    try {
        if(id("close_bottom_button").exists()){
            id("close_bottom_button").findOne().click();
        }
        id("video_detail_recyclerview").className("android.support.v7.widget.RecyclerView").scrollable(true).findOne().children().forEach(child => {
            var target = child.findOne(id("iv_dialog_close"));
            target.click();
        });
    } catch (e) { 
        console.log("彩蛋视频错误：",e);
    }
}
function closeGoderEgg() {
    if (id("close_bottom_button").exists()) {
        try {
            toastLog("关闭金丹");
            if(id("close_bottom_button").exists()){
                id("close_bottom_button").findOne().click();
            }
        } catch (e) {
            toastLog(e);
        }

    }
}
function closeAd() {
    if(id("btn_layout").exists()){
        id("btn_layout").findOne().child(0).click();
        console.log("正在播放广告");
        mSecCount(35000);
        className("android.widget.ImageView").findOne().click();
        back();
    }else{
        console.log("未找到翻倍按钮");
    }
    
    if (id("btn_back").exists()) {
        try {
            toastLog("关闭广告");
            if(id("btn_back").exists()){
                id("btn_back").findOne().click();
            }
            if(id("close_bottom_button").exists()){
                id("close_bottom_button").findOne().click();
            }
            
        } catch (e) {
            console.log("彩蛋视频错误：",e);
        }
    }
}

function youngWin() {
    if (youngWin = text("我知道了").exists()) {
        toastLog("点击了我知道了(青少年窗口)");
        youngWin.click();
    };
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
    if (index == 1) {
        toastLog("随机点赞并休息一秒");
    }
}

function randomFollow() {
    index = random(1, 100);
    if (index == 66) {
        toastLog("随机关注并休息一秒");
        
        if (id('attention').exists()) {
            var target = id('attention').findOne();
            target.click();
            mSecCount(1000);
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

var caidanTask={};
caidanTask.runCaiDanTask=()=>runCaiDanTask();
module.exports = caidanTask;