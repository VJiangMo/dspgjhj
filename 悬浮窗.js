var storage = storages.create("攒外快网_短视频合集");
var douyinTask=require("抖音极速版.js");
var baiduTask=require("百度极速版.js");
var kuaishouTask=require("快手极速版.js");
var huoshanTask=require("抖音火山版.js");
var caidanTask=require("彩蛋视频.js");
var huohuoTask=require("火火视频极速版.js");

var img_url = "http://zwk365.com/wp-content/uploads/2021/12/logo.png";

//开发者ID  (后台 左上角头像下方的ID)
var DeveloperID =storage.get("DeveloperID","");

//API 密码 (后台 设置中的 接口安全密码)
var ApiPassword = storage.get("ApiPassword","");

//软件名称
var SoftwareName = storage.get("SoftwareName","");

悬浮窗();

function 悬浮窗() {
    window = floaty.rawWindow(
        <horizontal gravity="center_vertical">
            <img id="图标" src="{{img_url}}" w="50" h="50" alpha="0.8" circle="true" borderWidth="2dp" borderColor="#202020" />
            <horizontal id="抽屉">
                <vertical>
                    <button id="ui_运行" textColor="#FFFFFF" text="开始" bg="#4F4F4F" padding="0" h="40" w="60"/>
                    <text text="" h="1" />
                    <button id="ui_关闭" textColor="#FFFFFF" text="结束" bg="#4F4F4F" padding="0" h="40" w="60"/>
                </vertical>
            </horizontal>
        </horizontal>
    );
    window.setPosition(100, device.height / 6);
    window.exitOnClose();
    setInterval(() => {}, 1000);

    window.抽屉.visibility = 8;

    状态 = false;
    var execution = null;
    var x = 0,
        y = 0;
    var windowX, windowY;
    var downTime;

    window.图标.setOnTouchListener(function(view, event) {
        switch (event.getAction()) {
            case event.ACTION_DOWN:
                x = event.getRawX();
                y = event.getRawY();
                windowX = window.getX();
                windowY = window.getY();
                downTime = new Date().getTime();
                return true;
            case event.ACTION_MOVE:
                window.setPosition(windowX + (event.getRawX() - x),
                    windowY + (event.getRawY() - y));
                return true;
            case event.ACTION_UP:
                if (Math.abs(event.getRawY() - y) < 5 && Math.abs(event.getRawX() - x) < 5) {
                    抽屉状态();
                }
                return true;
        }
        return true;
    });

    function 抽屉状态() {
        if (window.抽屉.visibility == 8) {
            window.抽屉.visibility = 0;
        } else {
            window.抽屉.visibility = 8;
        }
    }

    window.ui_关闭.setOnTouchListener(function(view, event) {
        if (event.getAction() == event.ACTION_UP) {
            toastLog("关闭脚本...");
            window.close();
            exit();
        }
        return true;
    });

    //运行按钮事件
    window.ui_运行.setOnTouchListener(function(view, event) {
        if (event.getAction() == event.ACTION_UP) {
            window.setPosition(100, device.height / 6);
            window.disableFocus();
            if (window.ui_运行.text() == "开始") {
                window.ui_运行.text("暂停");
                console.log("开始运行悬浮窗");

                var main = threads.start(function() {
                    try {
                        if(DeveloperID!="14273"||ApiPassword!="854855"||SoftwareName!="zwktyjb"){
                            main.interrupt();
                            toastLog("请用正版，联系QQ：3093074221");
                            clearInterval(监控状态);
                        }
                        device.keepScreenOn();
                        var 开启抖音极速版=storage.get("开启抖音极速版",false);
                        console.log("开启抖音极速版"+开启抖音极速版);

                        var 开启百度极速版=storage.get("开启百度极速版",false);
                        console.log("开启百度极速版"+开启百度极速版);

                        var 开启快手极速版=storage.get("开启快手极速版",false);
                        console.log("开启快手极速版"+开启快手极速版);

                        var 开启抖音火山版=storage.get("开启抖音火山版",false);
                        console.log("开启抖音火山版"+开启抖音火山版);

                        var 开启彩蛋短视频=storage.get("开启彩蛋视频",false);
                        console.log("开启彩蛋短视频"+开启彩蛋短视频);

                        var 开启火火极速版=storage.get("开启火火极速版",false);
                        console.log("开启火火极速版"+开启火火极速版);

                        storage.put("首次启动快手",true);

                        while(true){
                            try{
                                if(true==开启快手极速版){
                                    kuaishouTask.runKuaiShouTask();
                                }
                                if(true==开启抖音极速版){
                                    douyinTask.runDouYinTask();
                                }
                                if(true==开启抖音火山版){
                                    huoshanTask.runHuoShanTask();
                                }
                                if(true==开启百度极速版){
                                    baiduTask.runBaiDuTask();
                                }
                                if(true==开启彩蛋短视频){
                                    caidanTask.runCaiDanTask();
                                }
                                if(true==开启火火极速版){
                                    huohuoTask.runHuoHuoTask();
                                }
                                sleep(1000);
                                toastLog("执行下一轮任务");
                            }catch(error){
                                console.log("脚本捕获错误：",error);
                            }
                        }
                    } catch (error) {
                        console.log("脚本捕获错误：",error);
                    }
                })

                setTimeout(function() {
                    if (window.ui_运行.text() == "暂停") {
                        抽屉状态()
                    }
                }, 3000)

                var 监控状态 = setInterval(function() {
                    if (window.ui_运行.text() == "开始") {
                        main.interrupt()
                        toastLog("暂停了")
                        clearInterval(监控状态)
                    }
                }, 100)

            } else {
                状态 = false;
                window.ui_运行.text("开始");
                toastLog("开始暂停...");
            }
        }
        return true;
    });
}