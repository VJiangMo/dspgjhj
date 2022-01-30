"ui";
var storages = storages.create("擎苍的配置");
var floatyPermission = storages.get('floatyPermission', false);
var 识别率 = storages.get("识别率",0.7)
device.keepScreenOn(5* 3600 * 1000);//长亮
setInterval(()=>{}, 1000);//保持脚本运行
ui.statusBarColor("#FFBEBEBE")//最上方颜色
$settings.setEnabled('foreground_service', true);//前台服务
android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
$power_manager.requestIgnoreBatteryOptimizations()
if(!files.exists("///sdcard/kami.dat")){
    files.create("///sdcard/kami.dat");
}
var store_kami=files.read("///sdcard/kami.dat");
toastLog("存储的卡密："+store_kami);
var zwk_kami="";
dialogs.build({
    title: "请输入卡密：",
    titleColor: "black",
    content:"联系客服，获取免费卡密学习",
    contentColor:"black",
    contentLineSpacing:0.5,
    inputPrefill: store_kami,
    positive: "确认",
    positiveColor: "#3ADD57",
    negative: "取消",
    negativeColor: "#FF0000",
    cancelable:false,
    canceledOnTouchOutside:false
}).on("input", (text, dialog)=>{
    console.log("你输入的是" + text);
    zwk_kami=text;
}).on("positive", () => {
    console.log("确认");
    zwk_login();
}).on("negative", () => {
    console.log("取消");
    threads.start(function() {
        var ret = pjysdk.CardLogout();
        if (ret.code == 0) {
            toast("退出成功");
            exit()
        } else {
            toast(ret.message);
        }
    });
    exit();
}).show();

const PJYSDK = (function(){
    function PJYSDK(app_key, app_secret){
        http.__okhttp__.setMaxRetries(0);
        http.__okhttp__.setTimeout(10*1000);

        this.event = events.emitter();

        this.debug = true;
        this._lib_version = "v1.08";
        this._protocol = "https";
        this._host = "api.paojiaoyun.com";
        this._device_id = this.getDeviceID();
        this._retry_count = 9;
        
        this._app_key = "c1tgra4o6itbdn9h98f0"
        this._app_secret = "WS5RMyA35sgHq1NkHlo2Pb0pZtjd0jcq"
        
        this._card = null;
        this._username = null;
        this._password = null;
        this._token = null;
        
        this.is_trial = false;  // 是否是试用用户
        this.login_result = {
            "card_type": "",
            "expires": "",
            "expires_ts": 0,
            "config": "",
        };

        this._auto_heartbeat = true;  // 是否自动开启心跳任务
        this._heartbeat_gap = 60 * 1000; // 默认60秒
        this._heartbeat_task = null;
        this._heartbeat_ret = {"code": -9, "message": "还未开始验证"};

        this._prev_nonce = null;
    }
    PJYSDK.prototype.SetCard = function(card) {
        this._card = card.trim();
    }
    PJYSDK.prototype.SetUser = function(username, password) {
        this._username = username.trim();
        this._password = password;
    }
    PJYSDK.prototype.getDeviceID = function() {
        let id = device.serial;
        if (id == null || id == "" || id == "unknown") {
            id = device.getAndroidId();
        }
        if (id == null || id == "" || id == "unknown") {
            id = device.getIMEI();
        }
        return id;
    }
    PJYSDK.prototype.MD5 = function(str) {
        try {
            let digest = java.security.MessageDigest.getInstance("md5");
            let result = digest.digest(new java.lang.String(str).getBytes("UTF-8"));
            let buffer = new java.lang.StringBuffer();
            for (let index = 0; index < result.length; index++) {
                let b = result[index];
                let number = b & 0xff;
                let str = java.lang.Integer.toHexString(number);
                if (str.length == 1) {
                    buffer.append("0");
                }
                buffer.append(str);
            }
            return buffer.toString();
        } catch (error) {
            alert(error);
            return "";
        }
    }
    PJYSDK.prototype.getTimestamp = function() {
        try {
            let res = http.get("http://api.m.taobao.com/rest/api3.do?api=mtop.common.getTimestamp");
            let data = res.body.json();
            return Math.floor(data["data"]["t"]/1000);
        } catch (error) {
            return Math.floor(new Date().getTime()/1000);
        }
    }
    PJYSDK.prototype.genNonce = function() {
        const ascii_str = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let tmp = '';
        for(let i = 0; i < 20; i++) {
            tmp += ascii_str.charAt(Math.round(Math.random()*ascii_str.length));
        }
        return this.MD5(this.getDeviceID() + tmp);
    }
    PJYSDK.prototype.joinParams = function(params) {
        let ps = [];
        for (let k in params) {
            ps.push(k + "=" + params[k])
        }
        ps.sort()
        return ps.join("&")
    }
    PJYSDK.prototype.CheckRespSign = function(resp) {
        if (resp.code != 0 && resp.nonce === "" && resp.sign === "") {
            return resp
        }

        let ps = "";
        if (resp["result"]) {
            ps = this.joinParams(resp["result"]);
        }

        let s = resp["code"] + resp["message"] + ps + resp["nonce"] + this._app_secret;
        let sign = this.MD5(s);
        if (sign === resp["sign"]) {
            if (this._prev_nonce === null) {
                this._prev_nonce = resp["nonce"];
                return {"code":0, "message":"OK"};
            } else {
                if (resp["nonce"] > this._prev_nonce) {
                    this._prev_nonce = resp["nonce"];
                    return {"code": 0, "message": "OK"};
                } else {
                    return {"code": -98, "message": "轻点，疼~"};
                }
            }
        }
        return {"code": -99, "message": "轻点，疼~"};
    }
    PJYSDK.prototype.retry_fib = function(num) {
        if (num > 9) {
            return 34
        }
        let a = 0;
        let b = 1;
        for (i = 0; i < num; i++) {
            let tmp = a + b;
            a = b
            b = tmp
        }
        return a
    }
    PJYSDK.prototype._debug = function(path, params, result) {
        if (this.debug) {
            log("\n" + path, "\nparams:", params, "\nresult:", result);
        }
    }
    PJYSDK.prototype.Request = function(method, path, params) {
        // 构建公共参数
        params["app_key"] = this._app_key;

        method = method.toUpperCase();
        let url = this._protocol + "://" + this._host + path
        let max_retries = this._retry_count;
        let retries_count = 0;

        let data = {"code": -1, "message": "连接服务器失败"};
        do {
            retries_count++;
            let sec = this.retry_fib(retries_count);

            delete params["sign"]
            params["nonce"] = this.genNonce();
            params["timestamp"] = this.getTimestamp();
            let ps = this.joinParams(params);
            let s = method + this._host + path + ps + this._app_secret;
            let sign = this.MD5(s);
            params["sign"] = sign;

            let resp, body;
            try {    
                if (method === "GET") {
                    resp = http.get(url + "?" + ps + "&sign=" + sign);
                } else {  // POST
                    resp = http.post(url, params);
                }
                body = resp.body.string();
                data = JSON.parse(body);
                this._debug(method+'-'+path+':', params, data);
                
                let crs = this.CheckRespSign(data);
                if (crs.code !== 0) {
                    return crs;
                } else {
                    return data;
                }
            } catch (error) {
                log("[*] request error: ", error, sec + "s后重试");
                this._debug(method+'-'+path+':', params, body)
                sleep(sec*1000);
            }
        } while (retries_count < max_retries);

        return data;
    }
    /* 通用 */
    PJYSDK.prototype.GetHeartbeatResult = function() {
        return this._heartbeat_ret;
    }
    PJYSDK.prototype.GetTimeRemaining = function() {
        let g = this.login_result.expires_ts - this.getTimestamp();
        if (g < 0) {
            return 0;
        } 
        return g;
    }
    /* 卡密相关 */
    PJYSDK.prototype.CardLogin = function() {  // 卡密登录
        if (!this._card) {
            return {"code": -4, "message": "请先填入卡密"};
        }
        let method = "POST";
        let path = "/v1/card/login";
        let data = {"card": this._card, "device_id": this._device_id};
        let ret = this.Request(method, path, data);
        if (ret.code == 0) {
            this._token = ret.result.token;
            this.login_result = ret.result;
            if (this._auto_heartbeat) {
                this._startCardHeartheat();
            }
        }
        return ret;
    }
    PJYSDK.prototype.CardHeartbeat = function() {  // 卡密心跳，默认会自动调用
        if (!this._token) {
            return {"code": -2, "message": "请在卡密登录成功后调用"};
        }
        let method = "POST";
        let path = "/v1/card/heartbeat";
        let data = {"card": this._card, "token": this._token};
        let ret = this.Request(method, path, data);
        if (ret.code == 0) {
            this.login_result.expires = ret.result.expires;
            this.login_result.expires_ts = ret.result.expires_ts;
        }
        return ret;
    }
    PJYSDK.prototype._startCardHeartheat = function() {  // 开启卡密心跳任务
        if (this._heartbeat_task) {
            this._heartbeat_task.interrupt();
            this._heartbeat_task = null;
        }
        this._heartbeat_task = threads.start(function(){
            setInterval(function(){}, 10000);
        });
        this._heartbeat_ret = this.CardHeartbeat();
        
        this._heartbeat_task.setInterval((self) => {
            self._heartbeat_ret = self.CardHeartbeat();
            if (self._heartbeat_ret.code != 0) {
                self.event.emit("heartbeat_failed", self._heartbeat_ret);
            }
        }, this._heartbeat_gap, this);

        this._heartbeat_task.setInterval((self) => {
            if (self.GetTimeRemaining() == 0) {
                self.event.emit("heartbeat_failed", {"code": 10210, "message": "卡密已过期！"});
            }
        }, 1000, this);
    }
    PJYSDK.prototype.CardLogout = function() {  // 卡密退出登录
        this._heartbeat_ret = {"code": -9, "message": "还未开始验证"};
        if (this._heartbeat_task) { // 结束心跳任务
            this._heartbeat_task.interrupt();
            this._heartbeat_task = null;
        }
        if (!this._token) {
            return {"code": 0, "message": "OK"};
        }
        let method = "POST";
        let path = "/v1/card/logout";
        let data = {"card": this._card, "token": this._token};
        let ret = this.Request(method, path, data);
        // 清理
        this._token = null;
        this.login_result = {
            "card_type": "",
            "expires": "",
            "expires_ts": 0,
            "config": "",
        };
        return ret;
    }
    PJYSDK.prototype.CardUnbindDevice = function() { // 卡密解绑设备，需开发者后台配置
        if (!this._token) {
            return {"code": -2, "message": "请在卡密登录成功后调用"};
        }
        let method = "POST";
        let path = "/v1/card/unbind_device";
        let data = {"card": this._card, "device_id": this._device_id, "token": this._token};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.SetCardUnbindPassword = function(password) { // 自定义设置解绑密码
        if (!this._token) {
            return {"code": -2, "message": "请在卡密登录成功后调用"};
        }
        let method = "POST";
        let path = "/v1/card/unbind_password";
        let data = {"card": this._card, "password": password, "token": this._token};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.CardUnbindDeviceByPassword = function(password) { // 用户通过解绑密码解绑设备
        let method = "POST";
        let path = "/v1/card/unbind_device/by_password";
        let data = {"card": this._card, "password": password};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.CardRecharge = function(card, use_card) { // 以卡充卡
        let method = "POST";
        let path = "/v1/card/recharge";
        let data = {"card": card, "use_card": use_card};
        return this.Request(method, path, data);
    }
    /* 用户相关 */
    PJYSDK.prototype.UserRegister = function(username, password, card) {  // 用户注册（通过卡密）
        let method = "POST";
        let path = "/v1/user/register";
        let data = {"username": username, "password": password, "card": card, "device_id": this._device_id};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.UserLogin = function() {  // 用户账号登录
        if (!this._username || !this._password) {
            return {"code": -4, "message": "请先设置用户账号密码"};
        }
        let method = "POST";
        let path = "/v1/user/login";
        let data = {"username": this._username, "password": this._password, "device_id": this._device_id};
        let ret = this.Request(method, path, data);
        if (ret.code == 0) {
            this._token = ret.result.token;
            this.login_result = ret.result;
            if (this._auto_heartbeat) {
                this._startUserHeartheat();
            }
        }
        return ret;
    }
    PJYSDK.prototype.UserHeartbeat = function() {  // 用户心跳，默认会自动开启
        if (!this._token) {
            return {"code": -2, "message": "请在用户登录成功后调用"};
        }
        let method = "POST";
        let path = "/v1/user/heartbeat";
        let data = {"username": this._username, "token": this._token};
        let ret = this.Request(method, path, data);
        if (ret.code == 0) {
            this.login_result.expires = ret.result.expires;
            this.login_result.expires_ts = ret.result.expires_ts;
        }
        return ret;
    }
    PJYSDK.prototype._startUserHeartheat = function() {  // 开启用户心跳任务
        if (this._heartbeat_task) {
            this._heartbeat_task.interrupt();
            this._heartbeat_task = null;
        }
        this._heartbeat_task = threads.start(function(){
            setInterval(function(){}, 10000);
        });
        this._heartbeat_ret = this.UserHeartbeat();

        this._heartbeat_task.setInterval((self) => {
            self._heartbeat_ret = self.UserHeartbeat();
            if (self._heartbeat_ret.code != 0) {
                self.event.emit("heartbeat_failed", self._heartbeat_ret);
            }
        }, this._heartbeat_gap, this);

        this._heartbeat_task.setInterval((self) => {
            if (self.GetTimeRemaining() == 0) {
                self.event.emit("heartbeat_failed", {"code": 10250, "message": "用户已到期！"});
            }
        }, 1000, this);
    }
    PJYSDK.prototype.UserLogout = function() {  // 用户退出登录
        this._heartbeat_ret = {"code": -9, "message": "还未开始验证"};
        if (this._heartbeat_task) { // 结束心跳任务
            this._heartbeat_task.interrupt();
            this._heartbeat_task = null;
        }
        if (!this._token) {
            return {"code": 0, "message": "OK"};
        }
        let method = "POST";
        let path = "/v1/user/logout";
        let data = {"username": this._username, "token": this._token};
        let ret = this.Request(method, path, data);
        // 清理
        this._token = null;
        this.login_result = {
            "card_type": "",
            "expires": "",
            "expires_ts": 0,
            "config": "",
        };
        return ret;
    }
    PJYSDK.prototype.UserChangePassword = function(username, password, new_password) {  // 用户修改密码
        let method = "POST";
        let path = "/v1/user/password";
        let data = {"username": username, "password": password, "new_password": new_password};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.UserRecharge = function(username, card) { // 用户通过卡密充值
        let method = "POST";
        let path = "/v1/user/recharge";
        let data = {"username": username, "card": card};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.UserUnbindDevice = function() { // 用户解绑设备，需开发者后台配置
        if (!this._token) {
            return {"code": -2, "message": "请在用户登录成功后调用"};
        }
        let method = "POST";
        let path = "/v1/user/unbind_device";
        let data = {"username": this._username, "device_id": this._device_id, "token": this._token};
        return this.Request(method, path, data);
    }
    /* 配置相关 */
    PJYSDK.prototype.GetCardConfig = function() { // 获取卡密配置
        let method = "GET";
        let path = "/v1/card/config";
        let data = {"card": this._card};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.UpdateCardConfig = function(config) { // 更新卡密配置
        let method = "POST";
        let path = "/v1/card/config";
        let data = {"card": this._card, "config": config};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.GetUserConfig = function() { // 获取用户配置
        let method = "GET";
        let path = "/v1/user/config";
        let data = {"user": this._username};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.UpdateUserConfig = function(config) { // 更新用户配置
        let method = "POST";
        let path = "/v1/user/config";
        let data = {"username": this._username, "config": config};
        return this.Request(method, path, data);
    }
    /* 软件相关 */
    PJYSDK.prototype.GetSoftwareConfig = function() { // 获取软件配置
        let method = "GET";
        let path = "/v1/software/config";
        return this.Request(method, path, {});
    }
    PJYSDK.prototype.GetSoftwareNotice = function() { // 获取软件通知
        let method = "GET";
        let path = "/v1/software/notice";
        return this.Request(method, path, {});
    }
    PJYSDK.prototype.GetSoftwareLatestVersion = function(current_ver) { // 获取软件最新版本
        let method = "GET";
        let path = "/v1/software/latest_ver";
        let data = {"version": current_ver};
        return this.Request(method, path, data);
    }
    /* 试用功能 */
    PJYSDK.prototype.TrialLogin = function() {  // 试用登录
        let method = "POST";
        let path = "/v1/trial/login";
        let data = {"device_id": this._device_id};
        let ret = this.Request(method, path, data);
        if (ret.code == 0) {
            this.is_trial = true;
            this.login_result = ret.result;
            if (this._auto_heartbeat) {
                this._startTrialHeartheat();
            }
        }
        return ret;
    }
    PJYSDK.prototype.TrialHeartbeat = function() {  // 试用心跳，默认会自动调用
        let method = "POST";
        let path = "/v1/trial/heartbeat";
        let data = {"device_id": this._device_id};
        let ret = this.Request(method, path, data);
        if (ret.code == 0) {
            this.login_result.expires = ret.result.expires;
            this.login_result.expires_ts = ret.result.expires_ts;
        }
        return ret;
    }
    PJYSDK.prototype._startTrialHeartheat = function() {  // 开启试用心跳任务
        if (this._heartbeat_task) {
            this._heartbeat_task.interrupt();
            this._heartbeat_task = null;
        }
        this._heartbeat_task = threads.start(function(){
            setInterval(function(){}, 10000);
        });
        this._heartbeat_ret = this.TrialHeartbeat();

        this._heartbeat_task.setInterval((self) => {
            self._heartbeat_ret = self.TrialHeartbeat();
            if (self._heartbeat_ret.code != 0) {
                self.event.emit("heartbeat_failed", self._heartbeat_ret);
            }
        }, this._heartbeat_gap, this);

        this._heartbeat_task.setInterval((self) => {
            if (self.GetTimeRemaining() == 0) {
                self.event.emit("heartbeat_failed", {"code": 10407, "message": "试用已到期！"});
            }
        }, 1000, this);
    }
    PJYSDK.prototype.TrialLogout = function() {  // 试用退出登录，没有http请求，只是清理本地记录
        this.is_trial = false;
        this._heartbeat_ret = {"code": -9, "message": "还未开始验证"};
        if (this._heartbeat_task) { // 结束心跳任务
            this._heartbeat_task.interrupt();
            this._heartbeat_task = null;
        }
        // 清理
        this._token = null;
        this.login_result = {
            "card_type": "",
            "expires": "",
            "expires_ts": 0,
            "config": "",
        };
        return {"code": 0, "message": "OK"};;
    }
    /* 高级功能 */
    PJYSDK.prototype.GetRemoteVar = function(key) { // 获取远程变量
        let method = "GET";
        let path = "/v1/af/remote_var";
        let data = {"key": key};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.GetRemoteData = function(key) { // 获取远程数据
        let method = "GET";
        let path = "/v1/af/remote_data";
        let data = {"key": key};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.CreateRemoteData = function(key, value) { // 创建远程数据
        let method = "POST";
        let path = "/v1/af/remote_data";
        let data = {"action": "create", "key": key, "value": value};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.UpdateRemoteData = function(key, value) { // 修改远程数据
        let method = "POST";
        let path = "/v1/af/remote_data";
        let data = {"action": "update", "key": key, "value": value};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.DeleteRemoteData = function(key, value) { // 删除远程数据
        let method = "POST";
        let path = "/v1/af/remote_data";
        let data = {"action": "delete", "key": key};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.CallRemoteFunc = function(func_name, params) { // 执行远程函数
        let method = "POST";
        let path = "/v1/af/call_remote_func";
        let ps = JSON.stringify(params);
        let data = {"func_name": func_name, "params": ps};
        let ret = this.Request(method, path, data);
        if (ret.code == 0 && ret.result.return) {
            ret.result = JSON.parse(ret.result.return);
        }
        return ret;
    }
    return PJYSDK;
})();


var app_key = "c1tgra";
app_key=app_key+"4o6itbd";
app_key=app_key+"n9h98f0"; 
var app_secret = "WS5RMy";
app_secret=app_secret+"A35sgHq";
app_secret=app_secret+"1NkHlo2P";
app_secret=app_secret+"b0pZtj";
app_secret=app_secret+"d0jcq"; 
var pjysdk = new PJYSDK(app_key, app_secret);
pjysdk.debug = false;

pjysdk.event.on("heartbeat_failed", function(hret) {
    toast(hret.message);
    exit();
});

function zwk_login() {
    var card = zwk_kami;
    if(card.length<=0){
        toast("请先输入卡密!!");
        exit();
        return;
    }
    if (card.trim() == "123466") {
        file = open("/sdcard/jiuai2.txt", "r")
        var card123456=file.readline();
        file.close()
        var login_ret = pjysdk.CardLogin();
        pjysdk.SetCard(card123456);
        if (login_ret.code == 0) {
            toast("登录成功");
            ui.run(()=>{zhujiemianUI()})
        }
    }
    
    pjysdk.SetCard(card);
    threads.start(function() {
        var login_ret = pjysdk.CardLogin();
        if (login_ret.code == 0) {
            toast("登录成功");
            zhuye();                      
        } else {
            toast(login_ret.message);
            exit();
        }
    });
}

function zhuye(){
    let kami=zwk_kami;
    files.write("///sdcard/kami.dat",kami);
    toastLog("存储卡密："+files.read("///sdcard/kami.dat"));
}

ui.layout(
    <vertical bg="#FFBEBEBE">
        <card w="*" h="*" margin="5 5 5 5">
        <img scaleType="fitXY" src="http://zwk365.com/wp-content/uploads/2022/01/bluebg.jpg" />
        <vertical alpha="0.8">
            <toolbar w="*" h="40" marginTop="5" >
                    <img id="tb" w="0" h="0" margin="10 0" scaleType="fitXY" circle="true" layout_gravity="left" src="https://s3.ax1x.com/2020/12/13/revGp8.md.jpg" />
                    <text id="toolbar" text="擎苍辅助" textColor="black"layout_gravity="center" textSize="20sp"  typeface="monospace" />
                    <text id="display"  margin="5 5 5 5"  textStyle="bold|italic" textColor="black" textSize="20sp"/>
                    <img id="qqq" w="0" h="0" margin="14 0" scaleType="fitXY" circle="true" layout_gravity="right" src="https://s3.ax1x.com/2020/12/13/rmUWSs.jpg" />
            </toolbar>

            <card w="0" h="0" margin="5 5 5 5" cardCornerRadius="5dp" cardBackgroundColor="#B2FFFFFF" gravity="center">
                <horizontal id="gg" margin="5 0 5 0" >
                    <TextView id="ggnr" singleLine="true" ellipsize="marquee" focusable="true"textColor="red"textSize="15sp" text="1.欢迎使用此脚本，此脚本仅用于技术交流，请不要用作违法用途,本人不承担任何法律责任。2.本脚本为免费脚本！严禁贩卖！如果你从别的地方购买证明你已上当！3.点击左上角可以加入免费脚本群！" />
                </horizontal>
            </card>
            
            <card alpha="0.9" margin="5 5 5 5" cardCornerRadius="10dp" cardBackgroundColor="#B2FFFFFF" gravity="center_horizontal">
                <horizontal w="auto" h="auto" layout_gravity="center">
                    <Switch id="autoService" textColor="black" h="35" text="无障碍服务" checked="{{auto.service != null}}" textSize="18sp" />
                    <Switch id="floaty_button" marginLeft="40"  textColor="black" h="35" text="悬浮窗权限" checked="{{floatyPermission}}"  textSize="18sp" />
                </horizontal>
            </card>
            
            <card alpha="0.9" margin="5 5 5 5" cardCornerRadius="10dp" cardBackgroundColor="#B2FFFFFF" gravity="center">
                <horizontal w="*" h="35" gravity="center">
                    <checkbox id="sf" text="缩放" marginLeft="20" textColor="black" w="auto" h="39" checked="true" textSize="18sp"/>
                    <text text="--识别度 " textColor="black" textSize="18sp" />
                    <text id="sb" text="1" textColor="#FFFF0000" w="40" textSize="18sp" />
                    <text marginLeft="1" text="％" textColor="black" textSize="18sp" />
                    <seekbar w="*" id="识别" progress="-10" marginTop="3" max="9" textSize="18sp" />
                    
                </horizontal>
            </card>
            
        <scroll alpha="0.9">//滑动
            <vertical w="*" h="*">
                <card alpha="0.9" margin="5 5 5 5" cardCornerRadius="10dp" cardBackgroundColor="#CCFFFFFF" gravity="center">
                    <vertical>
                        <horizontal gravity="center">
                            <checkbox id="p1" text="维珍优创" textSize="18sp" textColor="black"/>
                            <text id="x1" text="去下载" marginLeft="20" textSize="18sp"textColor="#00CD00"/>
                            <input id="y1"  inputType="textLongMessage"  marginLeft="25" w="60" text="10" textSize="18sp" />
                            <text id="s1" text="分钟" marginLeft="5" textSize="18sp" textColor="blue"/>
                        </horizontal>
                        <horizontal gravity="center">
                            <checkbox id="p2" text="奖券世界" textSize="18sp" textColor="black"/>
                            <text id="x2" text="去下载" marginLeft="20" textSize="18sp"textColor="#00CD00"/>
                            <input id="y2"  inputType="textLongMessage"  marginLeft="25" w="60" text="50" textSize="18sp" />
                            <text id="s2" text="分钟" marginLeft="5" textSize="18sp"textColor="blue"/>
                        </horizontal>
                        <horizontal gravity="center">
                            <checkbox id="p3" text="鑫生活　" textSize="18sp" textColor="black"/>
                            <text id="x3" text="去下载" marginLeft="20" textSize="18sp"textColor="#00CD00"/>
                            <input id="y3"  inputType="textLongMessage"  marginLeft="25" w="60" text="10" textSize="18sp" />
                            <text id="s3" text="分钟" marginLeft="5" textSize="18sp"textColor="blue"/>
                        </horizontal>
                        <horizontal gravity="center">
                            <checkbox id="p4" text="几亩田　" textSize="18sp" textColor="black"/>
                            <text id="x4" text="去下载" marginLeft="20" textSize="18sp"textColor="#00CD00"/>
                            <input id="y4"  inputType="textLongMessage"  marginLeft="25" w="60" text="10" textSize="18sp" />
                            <text id="s4" text="分钟" marginLeft="5" textSize="18sp"textColor="blue"/>
                        </horizontal>
                        <horizontal gravity="center">
                            <checkbox id="p5" text="爱微影　" textSize="18sp" textColor="black"/>
                            <text id="x5" text="去下载" marginLeft="20" textSize="18sp"textColor="#00CD00"/>
                            <input id="y5"  inputType="textLongMessage"  marginLeft="25" w="60" text="50" textSize="18sp" />
                            <text id="s5" text="分钟" marginLeft="5" textSize="18sp"textColor="blue"/>
                        </horizontal>
                        <horizontal gravity="center">
                            <checkbox id="p6" text="开心翻天" textSize="18sp" textColor="black"/>
                            <text id="x6" text="去下载" marginLeft="20" textSize="18sp"textColor="#00CD00"/>
                            <input id="y6"  inputType="textLongMessage"  marginLeft="25" w="60" text="50" textSize="18sp" />
                            <text id="s6" text="分钟" marginLeft="5" textSize="18sp"textColor="blue"/>
                        </horizontal>
                        <horizontal gravity="center">
                            <checkbox id="p7" text="轻抖　　" textSize="18sp" textColor="black"/>
                            <text id="x7" text="去下载" marginLeft="20" textSize="18sp"textColor="#00CD00"/>
                            <input id="y7"  inputType="textLongMessage"  marginLeft="25" w="60" text="50" textSize="18sp" />
                            <text id="s7" text="分钟" marginLeft="5" textSize="18sp"textColor="blue"/>
                        </horizontal>
                        <horizontal gravity="center">
                            <checkbox id="p8" text="轻草　　" textSize="18sp" textColor="black"/>
                            <text id="x8" text="去下载" marginLeft="20" textSize="18sp"textColor="#00CD00"/>
                            <input id="y8"  inputType="textLongMessage"  marginLeft="25" w="60" text="50" textSize="18sp" />
                            <text id="s8" text="分钟" marginLeft="5" textSize="18sp"textColor="blue"/>
                        </horizontal>
                        <horizontal gravity="center">
                            <checkbox id="p9" text="直播抢单" textSize="18sp" textColor="black"/>
                            <text id="x9" text="去下载" marginLeft="20" textSize="18sp"textColor="#00CD00"/>
                            <input id="y9"  inputType="textLongMessage"  marginLeft="25" w="60" text="50" textSize="18sp" />
                            <text id="s9" text="分钟" marginLeft="5" textSize="18sp"textColor="blue"/>
                        </horizontal>
                        <horizontal gravity="center">
                            <checkbox id="p10" text="快乐糖果" textSize="18sp" textColor="black"/>
                            <text id="x10" text="去下载" marginLeft="20" textSize="18sp"textColor="#00CD00"/>
                            <input id="y10"  inputType="textLongMessage"  marginLeft="25" w="60" text="50" textSize="18sp" />
                            <text id="s10" text="分钟" marginLeft="5" textSize="18sp"textColor="blue"/>
                        </horizontal>
                    </vertical>
                </card>
                <button id="go" alpha="0.8" h="auto" margin="0 20" layout_gravity="center_horizontal" text="开始运行" w="*" textColor="#FFFF00" bg="#FF000000" textSize="18sp"/>
                <card alpha="0.9" margin="5 5 5 5" cardCornerRadius="10dp" cardBackgroundColor="#CCFFFFFF" gravity="center">
                    <vertical margin="20 0">
                        <text text=" 脚本说明:" textSize="18sp"textColor="black"/>
                        <text text=" 1.运行前开启无障碍、悬浮窗。"textColor="black"textSize="16sp"/>
                        <text text=" 2.安卓7.0以下用不了，请卸载。"textColor="black"textSize="16sp"/>
                        <text text=" 3.游戏不点击的，调整识别和缩放。"textColor="black"textSize="16sp"/>
                    </vertical>
                </card>
            </vertical>
        </scroll>//滑动
        </vertical>
        </card>
    </vertical>
)

var 软件名
var 包名
var 运行时间
var 广告线程
var 启动线程
var 平台=[]
var 版本 = "9"
var y1 = storages.get("y1");
var y2 = storages.get("y2");
var y3 = storages.get("y3");
var y4 = storages.get("y4");
var y5 = storages.get("y5");
var y6 = storages.get("y6");
var y7 = storages.get("y7");
var y8 = storages.get("y8");
var y9 = storages.get("y9");
var y10 = storages.get("y10");

if (y1 != null) {ui.y1.setText(y1);}
if (y2 != null) {ui.y2.setText(y2);}
if (y3 != null) {ui.y3.setText(y3);}
if (y4 != null) {ui.y4.setText(y4);}
if (y5 != null) {ui.y5.setText(y5);}
if (y6 != null) {ui.y6.setText(y6);}
if (y7 != null) {ui.y7.setText(y7);}
if (y8 != null) {ui.y8.setText(y8);}
if (y9 != null) {ui.y9.setText(y9);}
if (y10 != null) {ui.y10.setText(y10);}
//var 截图线程 = threads.start(function(){申请截图权限();截图线程.interrupt();})
//下载
ui.x1.click(function(){let url = "http://mtw.so/5KkhTO" ;
setClip(url);putlog("已复制链接","i");toast("已复制链接");app.openUrl(url)});
ui.x2.click(function(){let url = "http://mtw.so/5KkhgM" ;
setClip(url);putlog("已复制链接","i");toast("已复制链接");app.openUrl(url)});
ui.x3.click(function(){let url = "http://mtw.so/6lZYxC" ;
setClip(url);putlog("已复制链接","i");toast("已复制链接");app.openUrl(url)});
ui.x4.click(function(){let url = "http://mtw.so/5RQvHv" ;
setClip(url);putlog("已复制链接","i");toast("已复制链接");app.openUrl(url)});
ui.x5.click(function(){let url = "http://mtw.so/5S0zGB" ;
setClip(url);putlog("已复制链接","i");toast("已复制链接");app.openUrl(url)});
ui.x6.click(function(){let url = "http://mtw.so/5S0GlP" ;
setClip(url);putlog("已复制链接，微信打开","i");toast("已复制链接，微信打开");});
ui.x7.click(function(){let url = "http://mtw.so/6mbB4m" ;
setClip(url);putlog("已复制链接","i");toast("已复制链接");app.openUrl(url)});
ui.x8.click(function(){let url = "http://mtw.so/5YSo1g";
setClip(url);putlog("已复制链接","i");toast("已复制链接");app.openUrl(url)});
ui.x9.click(function(){let url = "http://mtw.so/6tz3Ub";
setClip(url);putlog("已复制链接","i");toast("已复制链接");app.openUrl(url)});
ui.x10.click(function(){let url = "https://wwr.lanzoui.com/iRnyGy4gxvi";
setClip(url);putlog("已复制链接","i");toast("已复制链接");app.openUrl(url)});
//判断安装
var 安装 = threads.start(function(){安装检测();安装.interrupt();})
function 安装检测(){
    for (let r = 0; r < 4; r++) {
    try{
    if(app.getAppName("cn.virgin.system")!=null){ui.x1.setText("已安装");}else{ui.x1.setTextColor(colors.rgb(255,0,0))}
    if(app.getAppName("com.caike.ticket")!=null){ui.x2.setText("已安装");}else{ui.x2.setTextColor(colors.rgb(255,0,0))}
    if(app.getAppName("com.example.xinlive")!=null){ui.x3.setText("已安装");}else{ui.x3.setTextColor(colors.rgb(255,0,0))}
    if(app.getAppName("com.jimutian.www")!=null){ui.x4.setText("已安装");}else{ui.x4.setTextColor(colors.rgb(255,0,0))}
    if(app.getAppName("com.zhw.ivy")!=null){ui.x5.setText("已安装");}else{ui.x5.setTextColor(colors.rgb(255,0,0))}
    if(app.getAppName("com.kxzft.cn")!=null){ui.x6.setText("已安装");}else{ui.x6.setTextColor(colors.rgb(255,0,0))}
    if(app.getAppName("com.qingdou.android")!=null){ui.x7.setText("已安装");}else{ui.x7.setTextColor(colors.rgb(255,0,0))}
    if(app.getAppName("com.qingcao.android.zygote")!=null){ui.x8.setText("已安装");}else{ui.x8.setTextColor(colors.rgb(255,0,0))}
    if(app.getAppName("com.hdguanjia.bjx")!=null){ui.x9.setText("已安装");}else{ui.x9.setTextColor(colors.rgb(255,0,0))}
    if(app.getAppName("com.og.klxtg")!=null){ui.x10.setText("已安装");}else{ui.x10.setTextColor(colors.rgb(255,0,0))}
    }catch(e){//log(e);
    continue;}
    }
}

//点击运行
ui.go.click(()=>{
    //判断无障碍
    if(auto.service == null) {toastLog("请先开启无障碍服务！")
    app.startActivity({action: "android.settings.ACCESSIBILITY_SETTINGS"})
    return}else{
    if(ui.go.text() == "开始运行"){
        ui.go.setText("停止运行")
        ui.go.setTextColor(colors.rgb(238,44,44))
    //音量监听
        threads.start(function(){
        events.observeKey();
        events.onKeyDown("volume_down",function(event){
        engines.stopAllAndToast();}); })
        cumtomUI();
        storages.put("y1", ui.y1.text());
        storages.put("y2", ui.y2.text());
        storages.put("y3", ui.y3.text());
        storages.put("y4", ui.y4.text());
        storages.put("y5", ui.y5.text());
        storages.put("y6", ui.y6.text());
        storages.put("y7", ui.y7.text());
        storages.put("y8", ui.y8.text());
        storages.put("y9", ui.y9.text());
        storages.put("y10", ui.y10.text());
        多平台()
        putlog(时间()+"脚本启动:音量下键关闭脚本");
    }else{
        ui.go.setTextColor(colors.rgb(0,255,0))
        ui.go.setText("开始运行")
        putlog(时间()+"线程结束","v")
        threads.shutDownAll()
        }
    }
})

function 多平台(){
    if(ui.p1.checked == true){平台[1]=true;}else{平台[1]=false;}
    if(ui.p2.checked == true){平台[2]=true;}else{平台[2]=false;}
    if(ui.p3.checked == true){平台[3]=true;}else{平台[3]=false;}
    if(ui.p4.checked == true){平台[4]=true;}else{平台[4]=false;}
    if(ui.p5.checked == true){平台[5]=true;}else{平台[5]=false;}
    if(ui.p6.checked == true){平台[6]=true;}else{平台[6]=false;}
    if(ui.p7.checked == true){平台[7]=true;}else{平台[7]=false;}
    if(ui.p8.checked == true){平台[8]=true;}else{平台[8]=false;}
    if(ui.p9.checked == true){平台[9]=true;}else{平台[9]=false;}
    if(ui.p10.checked == true){平台[10]=true;}else{平台[10]=false;}
    threads.start(function(){
        申请截图权限()
        开始多任务();
    })
}

function 开始多任务(){
if(平台[1]==true){维珍优创();平台[1]=false}
if(平台[2]==true){奖券世界();平台[2]=false}
if(平台[3]==true){鑫生活();平台[3]=false}
if(平台[4]==true){几亩田();平台[4]=false}
if(平台[5]==true){爱微影();平台[5]=false}
if(平台[6]==true){开心翻天();平台[6]=false}
if(平台[7]==true){轻抖();平台[7]=false}
if(平台[8]==true){轻抖();平台[8]=false}
if(平台[9]==true){直播抢单();平台[9]=false}
if(平台[10]==true){快乐糖果();平台[10]=false}
toastLog("任务全部完成，脚本结束")
threads.shutDownAll()
exit();
}

function 快乐糖果(){
    软件名 = "快乐糖果"
    包名 = "com.og.klxtg"
    putlog(时间()+"当前平台:"+软件名,"i");
    运行时间 = new Date().getTime()
    广告线程 = threads.start(function(){launch(包名);
    sleep(1000)
        while(true){
            try{
                关闭广告();
            }catch(err){
                //log(err);
                continue}}
    })
    sleep(800);
    if(text("允许").find().length > 0){text("允许").find().click()}
    sleep(2000)
    while(new Date().getTime() < 运行时间 + (ui.y10.text() * 60000)){
        try{
            if(id("tt_video_progress").exists() || textStartsWith("倒计时").exists() || textStartsWith("后可领取").exists() || textStartsWith("奖励于").exists() || textStartsWith("奖励将于").exists() || textStartsWith("即可获得奖").exists() || text("免费获取").exists()){}else{
            /*
            找图封装("翻天@发现作弊器", 识别率,10000)
            找图封装("翻天@我要作弊", 识别率,1000)
            */
            找图封装("快乐@开始游戏", 识别率,1000)
            找图封装("快乐@开始游戏 ", 识别率,1000)
            找图封装("快乐@点击红包", 识别率,1500)
            找图封装("快乐@点击红包 ", 识别率,1500)
            //找图封装("快乐@观看广告", 识别率,2000)
            找图封装("快乐@观看广告 ", 识别率,2000)
            找图封装("快乐@确定", 识别率,1500)
            找图封装("快乐@关闭", 识别率,1500)
            
            }
            //sleep(1000)
            跳出检测();
        }catch(e){
            //log(e);
            continue}
    }
    结束应用(包名)
    广告线程.interrupt();
}

function 直播抢单(){
    let 开启 = false
    软件名 = "白金熊"
    包名 = "com.hdguanjia.bjx"
    putlog(时间()+"当前平台:"+软件名,"i");
    运行时间 = new Date().getTime()
    广告线程 = threads.start(function(){launch(包名);
    sleep(1000)
        while(true){
            try{
                关闭广告();
            }catch(err){
                //log(err);
                continue}}
    })
    sleep(800);
    if(text("允许").find().length > 0){text("允许").find().click()}
    sleep(2000)
    while(new Date().getTime() < 运行时间 + (ui.y9.text() * 60000)){
        try{
            if(id("tv_disagree").text("已读").exists()){back();sleep(500)}
            if(id("teachingDialogCloseBtn").exists()){back();sleep(500)}
           
            if(开启==false){
                if(text("自动挂机").exists()){}else{
                    if(id("tv_tab_title").text("挂机").exists()){
                        let tr = id("tv_tab_title").text("挂机").find()[0].bounds()  
                        click(tr.centerX(), tr.centerY());
                        putlog(时间()+"点击挂机","i");sleep(500)
                    }
                }
                if(text("自动挂机").exists()){
                    if(text("已开启").find().length==3){
                        if(textStartsWith("已安装").find().length==3){
                            putlog(时间()+"权限全部开启","i");开启=true;sleep(1000)
                        }else{putlog(时间()+"请开启全部权限","i");sleep(1000)}
                    }else{putlog(时间()+"请开启全部权限","i");sleep(1000)}
                }
            }else{
                if(text("客服咨询").exists()){}else{
                    if(id("tv_tab_title").text("首页").exists()){
                        let tr = id("tv_tab_title").text("首页").find()[0].bounds()  
                        click(tr.centerX(), tr.centerY());
                        putlog(时间()+"点击首页","i");sleep(500)
                    }
                }
                if(text("客服咨询").exists()){
                    if(id("tv_status").text("去抢单").exists()){
                        putlog(时间()+"发现任务单，争抢中","i");
                        let t = text("去抢单").find().length
                        for(var i = 0;i < t;i++){
                        id("tv_status").text("去抢单").find()[i].click();sleep(1500)}
                        if(id("tv_status").text("去抢单").exists()){
                        曲线滑动(device.width / 2,  device.height*0.1, device.width / 2, device.height*0.8, 300);
                        //sleep(1000)
                        }
                        //if(text("允许").find().length > 0){text("允许").find().click()}
                    }else{
                        putlog(时间()+"没有任务，刷新中","i");
                        曲线滑动(device.width / 2,  device.height*0.1, device.width / 2, device.height*0.8, 300);
                        //sleep(1000)
                    }
                }
            }
            
            //sleep(1000)
            //跳出检测();
        }catch(e){
            log(e);
            continue}
    }
    结束应用(包名)
    广告线程.interrupt();
}

function 轻抖(){
    var 时间1 = ""
    if(平台[7]==true==true){
        时间1 = ui.y7.text()
        软件名 = "轻抖"
        包名 = "com.qingdou.android"
    }else{
        时间1 = ui.y8.text()
        软件名 = "轻草"
        包名 = "com.qingcao.android.zygote"
    }
    putlog(时间()+"当前平台:"+软件名,"i");
    运行时间 = new Date().getTime()
    广告线程 = threads.start(function(){launch(包名);
    sleep(1000)
        while(true){
            try{
               // 游戏内部广告，右上角凸出一个关闭按钮
    if(id("tt_insert_dislike_icon_img").exists()){id("tt_insert_dislike_icon_img").findOnce().click();putlog(时间()+"关闭内广告3")}
    
    //游戏内部广告(右上大个关闭)
    if(id("klevin_iv_interstitial").exists()){
        if(id("klevin_iv_close").exists()){
            id("klevin_iv_close").findOnce().click()
            putlog(时间()+"关闭内广告4")
        }
    }
    //游戏内部广告/有x
    if(id("ksad_video_container").exists()){
        if(className("android.view.View").clickable(true).depth(5).indexInParent(0).exists()){
            className("android.view.View").clickable(true).depth(5).indexInParent(0).findOnce().click()
            putlog(时间()+"关闭内广告5")
        }
        if(className("android.view.View").clickable(true).depth(9).drawingOrder(0).exists()){
            className("android.view.View").clickable(true).depth(9).drawingOrder(0).findOnce().click()
            putlog(时间()+"关闭内广告6")
        }
    }
    
    //右上角有x
    if(id("ksad_auto_close_btn").exists()){
        id("ksad_auto_close_btn").findOnce().click()
        putlog(时间()+"关闭内广告7")
    }
    
    if(id("tt_root_view").exists() || id("tt_top_dislike").exists()){}else{
    if(text("反馈").exists()){
        let i = text("反馈").find()[0].depth()
        if(text("广告").depth(Number(i)+2).exists()){
            if(className("android.widget.Image").depth(Number(i)).exists()){
                let tr = className("android.widget.Image").depth(Number(i)).find()[0].bounds()  
                click(tr.centerX(), tr.centerY());
                putlog(时间()+"关闭内广告8");sleep(500)
            }
        }
    }
    if(text("反馈").exists()){
        let i = text("反馈").find()[0].depth()
        if(text("广告").depth(Number(i)+2).exists()){
            if(className("android.widget.Image").depth(Number(i) + 1).exists()){
                let tr = className("android.widget.Image").depth(Number(i) + 1).find()[0].bounds()  
                click(tr.centerX(), tr.centerY());
                putlog(时间()+"关闭内广告9");sleep(500)
            }
        }
    }}
    
    //返回集合////////////////////////////////////////////////////////////////
    if(text("腾讯优量汇 - 模版2.0广告").exists() || id("mbridge_iv_close").exists()  ||  id("m-playable-close").exists() || id("btnFeedback").exists() ||id("tt_close_iv").exists() || id("banner_top").exists() || id("mimo_reward_close_img").exists() || textStartsWith("百度网盟推广").exists() || textStartsWith("恭喜获得奖励").exists() || textStartsWith("http").exists()){back()}
    if(text("无法关闭").exists() && text("不感兴趣").exists()){back()}
    
    //启动圆形跳过
    if(id("tt_splash_skip_btn").exists()){
        id("tt_splash_skip_btn").findOnce().click();putlog(时间()+"跳过启动广告1")}
    //椭圆跳过1
    if(id("ksad_splash_skip_view").exists()){
        id("ksad_splash_skip_view").findOnce().click();putlog(时间()+"跳过启动广告2")}
    
    //椭圆跳过2
    if(text("跳过").exists()){
        if(className("android.widget.FrameLayout").clickable(true).depth(9).drawingOrder(3).indexInParent(0).exists()){
            className("android.widget.FrameLayout").clickable(true).depth(9).drawingOrder(3).indexInParent(0).findOnce().click();
        }
    }
            }catch(err){
                //log(err);
                continue}}
    })
    sleep(800);
    if(text("允许").find().length > 0){text("允许").find().click()}
    sleep(2000)
    while(new Date().getTime() < 运行时间 + (时间1 * 60000)){
        try{
            if(text("文案提取").exists()){
                putlog(时间()+"部分手机要手动进入引流任务","i");sleep(500)
                找图封装("引流任务", 识别率,1000)
                找图封装("引流任务 ", 识别率,1000)
            }
            
            if(text("任务大厅").exists()){
                if(text("暖场").exists()){
                    let tr = text("暖场").find()[0].bounds()  
                    click(tr.centerX(), tr.centerY());
                    putlog(时间()+"点击引流","i");sleep(1000)
                }
                if(text("去赚钱").exists()){
                    let tr = text("去赚钱").find()[0].bounds()  
                    click(tr.centerX(), tr.centerY());
                    putlog(时间()+"点击去赚钱","i");sleep(1000)
                }else{
                    if(text("已完成").exists()){
                        let tr = text("已完成").find()[0].bounds()  
                        click(tr.centerX(), tr.centerY());
                        putlog(时间()+"点击已完成","i");sleep(1000)
                    }
                }
            }
                
            
            if(textStartsWith("任务详情").exists()){sleep(500)
                if(text("任务已结束").exists()){putlog(时间()+"没有引流任务，等待10秒","i");back();sleep(10000)}
                if(text("报名赚钱").exists()){putlog(时间()+"没有引流任务，等待10秒","i");back();sleep(10000)}
                if(text("我要涨粉").exists()){putlog(时间()+"没有引流任务，等待10秒","i");back();sleep(10000)}
                if(text("是否去看看订阅任务？").exists()){putlog(时间()+"没有引流任务，等待10秒","i");back();sleep(10000)}
                
                if(text("去赚钱").clickable(true).exists()){
                    text("去赚钱").clickable(true).findOnce().click()
                    putlog(时间()+"点击去赚钱，等待15秒","i");
                    for(var i = 0;i < 16;i++){putlog(时间()+"  "+i,"i");sleep(1000)}
                    putlog(时间()+"正在返回，等待3秒","i")
                    threads.start(function(){app.launch(包名);launchPackage(包名)})
                    app.launchPackage(包名);launch(包名);
                    sleep(3000)
                    
                }else{
                    if(text("接新单").clickable(true).exists()){
                        text("接新单").clickable(true).findOnce().click();
                        putlog(时间()+"点击去赚钱，等待15秒","i");
                        for(var i = 0;i < 16;i++){putlog(时间()+"  "+i,"i");sleep(1000)}
                        putlog(时间()+"正在返回，等待3秒","i")
                        threads.start(function(){app.launch(包名);launchPackage(包名)})
                        app.launchPackage(包名);launch(包名);
                        sleep(3000)
                    }
                }
            }
            
            if(text("重要通知").exists()){
                if(text("报名其他任务").exists()){
                    text("报名其他任务").findOnce().click();
                    putlog(时间()+"报名其他任务，等待3秒","i")
                    sleep(3000)
                }
                if(text("接新单").clickable(true).exists()){
                    text("接新单").clickable(true).findOnce().click();
                    putlog(时间()+"报名其他任务，等待3秒","i")
                    sleep(3000)
                }
            }
            sleep(1000)
        }catch(e){
            log(e);
            continue}
    }
    结束应用(包名)
    广告线程.interrupt();
}

function 开心翻天(){
    软件名 = "开心翻天"
    包名 = "com.kxzft.cn"
    putlog(时间()+"当前平台:"+软件名,"i");
    运行时间 = new Date().getTime()
    广告线程 = threads.start(function(){launch(包名);
    sleep(1000)
        while(true){
            try{
                关闭广告();
            }catch(err){
                //log(err);
                continue}}
    })
    sleep(800);
    if(text("允许").find().length > 0){text("允许").find().click()}
    sleep(2000)
    while(new Date().getTime() < 运行时间 + (ui.y6.text() * 60000)){
        try{
            if(id("tt_video_progress").exists() || textStartsWith("倒计时").exists() || textStartsWith("后可领取").exists() || textStartsWith("奖励于").exists() || textStartsWith("奖励将于").exists() || textStartsWith("即可获得奖").exists() || text("免费获取").exists()){}else{
            
            找图封装("翻天@发现作弊器", 识别率,10000)
            找图封装("翻天@我要作弊", 识别率,1000)
            /*
            找图封装("翻天@继续游戏", 识别率,1000)
            找图封装("翻天@继续游戏 ", 识别率,1000)
            找图封装("翻天@发现红包", 识别率,1000)
            找图封装("翻天@观看广告", 识别率,1000)
            找图封装("翻天@观看广告 ", 识别率,1000)
            找图封装("翻天@观看广告  ", 识别率,1000)
            找图封装("翻天@观看广告   ", 识别率,1000)
            找图封装("翻天@发现红包 ", 识别率,1000)
            */
            }
            sleep(1000)
            跳出检测();
        }catch(e){
            log(e);
            continue}
    }
    结束应用(包名)
    广告线程.interrupt();
}

function 爱微影(){
    软件名 = "爱微影"
    包名 = "com.zhw.ivy"
    putlog(时间()+"当前平台:"+软件名,"i");
    运行时间 = new Date().getTime()
    广告线程 = threads.start(function(){launch(包名);
    sleep(1000)
        while(true){
            try{
                关闭广告();
            }catch(err){
                //log(err);
                continue}}
    })
    sleep(800);
    if(text("允许").find().length > 0){text("允许").find().click()}
    sleep(2000)
    while(new Date().getTime() < 运行时间 + (ui.y5.text() * 60000)){
        try{
            
            if(id("iVRedpacket").exists()){
                id("iVRedpacket").findOnce().click()
                putlog(时间()+"点击看视频任务","i");sleep(1500)
            }
            if(id("mimo_banner_view_close").exists()){
                id("mimo_banner_view_close").findOnce().click();sleep(200)
            }
            if(text("广告加载中...").exists()){}else{
            if(id("tvWatchVideo").text("看视频").exists()){
                id("tvWatchVideo").text("看视频").findOnce().click()
                putlog(时间()+"观看广告","i");sleep(2500)
            }}
            
            if(id("ivRedpacekt").exists()){
                id("ivRedpacekt").findOnce().click();
                putlog(时间()+"领取红包","i");sleep(2500)
            }
            if(id("ivClose").exists()){
                id("ivClose").findOnce().click();sleep(500)
            }
            
                if(text("已完成").find().length >= 1){
                    break
                }
            
            sleep(1000)
            跳出检测();
        }catch(e){
            //log(e);
            continue}
    }
    结束应用(包名)
    广告线程.interrupt();
}

function 几亩田(){
    let k = 0
    let 每日 = false
    软件名 = "几亩田"
    包名 = "com.jimutian.www"
    putlog(时间()+"当前平台:"+软件名,"i");
    运行时间 = new Date().getTime()
    广告线程 = threads.start(function(){launch(包名);
    sleep(1000)
        while(true){
            try{
                关闭广告();
            }catch(err){
                //log(err);
                continue}}
    })
    sleep(800);
    if(text("允许").find().length > 0){text("允许").find().click()}
    sleep(2000)
    while(new Date().getTime() < 运行时间 + (ui.y4.text() * 60000)){
        try{
            if(text("去观看").exists() || textStartsWith("跳过").exists()){}else{
                if(每日==false){
                    if(id("tabTV").className("android.widget.TextView").text("我的").exists()){
                        let tr = id("tabTV").className("android.widget.TextView").text("我的").find()[0].bounds()  
                        click(tr.centerX(), tr.centerY());
                        putlog(时间()+"点击我的","i")
                        sleep(1500)
                    }
                    if(text("任务大厅").exists()){
                        let tr = text("任务大厅").find()[0].bounds()  
                        click(tr.centerX(), tr.centerY());
                        putlog(时间()+"点击任务大厅","i")
                        每日=true
                        sleep(1500)
                    }
                }
            }
            
            if(className("android.view.View").text("去观看").exists()){
                if(k>6){每日=false;sleep(1000);back();k=6;sleep(1500)}
                if(className("android.view.View").text("6/6").exists()){break;}else{
                    let tr = className("android.view.View").text("去观看").find()[0].bounds()
                    click(tr.centerX(), tr.centerY());
                    putlog(时间()+"观看广告","i")
                    sleep(4000)
                    k=k+1
                }
            }
            
            跳出检测();
        }catch(e){
            //log(e);
            continue}
    }
    结束应用(包名)
    广告线程.interrupt();
}

function 维珍优创(){
    let k = 0
    软件名 = "维珍优创"
    包名 = "cn.virgin.system"
    putlog(时间()+"当前平台:"+软件名,"i");
    运行时间 = new Date().getTime()
    广告线程 = threads.start(function(){launch(包名);
    sleep(1000)
        while(true){
            try{
                关闭广告();
            }catch(err){
                //log(err);
                continue}}
    })
    sleep(800);
    if(text("允许").find().length > 0){text("允许").find().click()}
    sleep(1000)
    while(new Date().getTime() < 运行时间 + (ui.y3.text() * 60000)){
        try{
            if(id("tabMineLayout").drawingOrder(4).exists()){
                id("tabMineLayout").drawingOrder(4).findOnce().click()
                putlog(时间()+"点击我的","i");sleep(1000)
            }
            if(id("ly_task").exists()){
                id("ly_task").findOnce().click()
                putlog(时间()+"点击任务大厅","i");sleep(1000)
            }
            
            if(className("android.view.View").text("今日签到").exists()){
                if(k>5){sleep(1000);back();k=5}
                android.view.accessibility.AccessibilityInteractionClient.getInstance().clearCache();
                sleep(1000)
                if(className("android.view.View").text("已签到").exists()){break;}else{
                    if(className("android.view.View").text("加载中").exists()){}else{sleep(500)
                        if(className("android.view.View").text("去观看").exists()){
                            className("android.view.View").text("去观看").findOnce().click()
                            putlog(时间()+"点击去观看","i");sleep(3000)
                            k=k+1
                        }
                    }
                }
            }

            跳出检测();
        }catch(e){
            //log(e);
            continue}
    }
    结束应用(包名)
    广告线程.interrupt();
}

function 奖券世界(){
    let 转盘 = false
    软件名 = "奖券世界"
    包名 = "com.caike.ticket"
    putlog(时间()+"当前平台:"+软件名,"i");
    运行时间 = new Date().getTime()
    广告线程 = threads.start(function(){launch(包名);
    sleep(1000)
        while(true){
            try{
                关闭广告();
            }catch(err){
                //log(err);
                continue}}
    })
    sleep(800);
    if(text("允许").find().length > 0){text("允许").find().click()}
    sleep(1000)
    while(new Date().getTime() < 运行时间 + (ui.y2.text() * 60000)){
        try{
            //翻倍
            if(id("btn_play").exists()){
                if(className("android.widget.TextView").text("翻倍领取").exists()){
                    id("btn_play").findOnce().click();sleep(1000)
                    putlog(时间()+"离线翻倍领取","i")
                }
            }
                
            //关闭升级奖励
            if(id("btn_close").exists()){
                id("btn_close").findOnce().click();sleep(500)
            }
            
            //广告得银币
            if(id("btn").exists()){
                if(className("android.widget.TextView").text("立即领取").exists()){
                    putlog(时间()+"领取银币","i")
                    id("btn").findOnce().click();sleep(1000)
                }
            }
            
            if(id("btn").exists()){
                if(className("android.widget.TextView").text("免广告领取").exists()){
                    putlog(时间()+"领取银币","i")
                    id("btn").findOnce().click();sleep(1000)
                }
            }
            
            //开心收下1
            if(id("btn").text("开心收下").exists()){
                id("btn").text("开心收下").findOnce().click()
                sleep(1000)
            }
            //开心收下2
            if(id("btn_claim").text("开心收下").exists()){
                id("btn_claim").text("开心收下").findOnce().click()
                sleep(1000)
            }
            
            if(className("android.widget.TextView").text("暂无领取次数").exists()){putlog(时间()+"广告已看完","i");sleep(1000);back();break;}
            
            if(转盘==false){
                //开启转盘
                if(id("iv_dial").exists()){
                    id("iv_dial").findOnce().click();sleep(1500)
                }
                
                if(className("android.widget.TextView").text("每天24:00恢复抽奖次数，当前剩余0次").exists()){
                    putlog(时间()+"转盘抽奖已完成","i");
                    sleep(800);back();
                    转盘=true
                }else{
                    //转盘1
                    if(id("btn").text("立刻抽奖").exists()){
                        id("btn").text("立刻抽奖").findOnce().click();sleep(1000)
                    }
                }
               
                //宝箱
                if(id("btn_video").enabled(true).exists()){
                    id("btn_video").enabled(true).findOnce().click();sleep(1000)
                }
                
            }else{
                //购买
                if(id("tab_buy").exists()){
                    id("tab_buy").findOnce().click();
                    id("tab_buy").findOnce().click();
                    id("tab_buy").findOnce().click();
                    id("tab_buy").findOnce().click();
                }
                
                //开启合成
                if(id("tv_stop_merge").text("停止合成").exists()){}else{
                    if(id("lyt_auto_merge").exists()){
                        id("lyt_auto_merge").findOnce().click();sleep(1000)
                    }
                    if(id("btn_video").exists()){
                        sleep(1000)
                        if(className("android.widget.TextView").text("看视频开启").exists()){
                            putlog(时间()+"点击自动合成","i")
                            id("btn_video").findOnce().click();sleep(1500)
                        }
                    }
                }
            }
            
            
            if(id("tabMineLayout").drawingOrder(4).exists()){
                id("tabMineLayout").drawingOrder(4).findOnce().click()
                putlog(时间()+"点击我的","i");sleep(1000)
            }
            if(id("ly_task").exists()){
                id("ly_task").findOnce().click()
                putlog(时间()+"点击任务大厅","i");sleep(1000)
            }
            
            if(className("android.view.View").text("今日签到").exists()){
                if(className("android.view.View").text("已签到").exists()){break;}else{
                    if(className("android.view.View").text("加载中").exists()){}else{
                        if(className("android.view.View").text("去观看").exists()){
                            className("android.view.View").text("去观看").findOnce().click()
                            putlog(时间()+"点击去观看","i");sleep(3000)
                        }
                    }
                }
            }

            跳出检测();
        }catch(e){
            //log(e);
            continue}
    }
    结束应用(包名)
    广告线程.interrupt();
}

function 鑫生活(){
    软件名 = "鑫生活"
    包名 = "com.example.xinlive"
    putlog(时间()+"当前平台:"+软件名,"i");
    运行时间 = new Date().getTime()
    广告线程 = threads.start(function(){launch(包名);
    sleep(1000)
        while(true){
            try{
                关闭广告();
            }catch(err){
                //log(err);
                continue}}
    })
    sleep(800);
    if(text("允许").find().length > 0){text("允许").find().click()}
    sleep(1000)
    while(new Date().getTime() < 运行时间 + (ui.y1.text() * 60000)){
        try{
            if(id("me").desc("我的").exists()){
                id("me").desc("我的").findOnce().click();putlog(时间()+"点击我的","i")
                sleep(1000)
            }
            if(id("pop_notice_finish").exists()){
                id("pop_notice_finish").findOnce().click();
            }
            if(id("me_money_look").exists()){
                id("me_money_look").findOnce().click();putlog(时间()+"点击钱包","i")
                sleep(1500)
            }
            
            if(text("999999").exists()){sleep(500)}else{
            if(text("去观看(8/8)").exists()){
                putlog(时间()+"今日打卡签到完成","i")
                break;
            }else{
            if(id("integral_AD_btn").exists()){
                id("integral_AD_btn").findOnce().click();putlog(时间()+"观看广告","i")
                sleep(2000)
            }}}
            
            sleep(1000)
            跳出检测();
        }catch(e){
            //log(e);
            continue}
    }
    结束应用(包名)
    广告线程.interrupt();
}

function 关闭广告() {
    //游戏内部广告，右上角凸出一个关闭按钮
    if(id("tt_insert_dislike_icon_img").exists()){id("tt_insert_dislike_icon_img").findOnce().click();putlog(时间()+"关闭内广告3")}
    
    //游戏内部广告(右上大个关闭)
    if(id("klevin_iv_interstitial").exists()){
        if(id("klevin_iv_close").exists()){
            id("klevin_iv_close").findOnce().click()
            putlog(时间()+"关闭内广告4")
        }
    }
    //游戏内部广告/有x
    if(id("ksad_video_container").exists()){
        if(className("android.view.View").clickable(true).depth(5).indexInParent(0).exists()){
            className("android.view.View").clickable(true).depth(5).indexInParent(0).findOnce().click()
            putlog(时间()+"关闭内广告5")
        }
        if(className("android.view.View").clickable(true).depth(9).drawingOrder(0).exists()){
            className("android.view.View").clickable(true).depth(9).drawingOrder(0).findOnce().click()
            putlog(时间()+"关闭内广告6")
        }
    }
    
    //右上角有x
    if(id("ksad_auto_close_btn").exists()){
        id("ksad_auto_close_btn").findOnce().click()
        putlog(时间()+"关闭内广告7")
    }
    
    if(id("tt_root_view").exists() || id("tt_top_dislike").exists()){}else{
    if(text("反馈").exists()){
        let i = text("反馈").find()[0].depth()
        if(text("广告").depth(Number(i)+2).exists()){
            if(className("android.widget.Image").depth(Number(i)).exists()){
                let tr = className("android.widget.Image").depth(Number(i)).find()[0].bounds()  
                click(tr.centerX(), tr.centerY());
                putlog(时间()+"关闭内广告8");sleep(500)
            }
        }
    }
    if(text("反馈").exists()){
        let i = text("反馈").find()[0].depth()
        if(text("广告").depth(Number(i)+2).exists()){
            if(className("android.widget.Image").depth(Number(i) + 1).exists()){
                let tr = className("android.widget.Image").depth(Number(i) + 1).find()[0].bounds()  
                click(tr.centerX(), tr.centerY());
                putlog(时间()+"关闭内广告9");sleep(500)
            }
        }
    }}
    
    //返回集合////////////////////////////////////////////////////////////////
    if(text("观看8次广告获得积分").exists()){}else{
        if(text("腾讯优量汇 - 模版2.0广告").exists() || id("mbridge_iv_close").exists()  ||  id("m-playable-close").exists() || id("btnFeedback").exists() ||id("tt_close_iv").exists() || id("banner_top").exists() || id("mimo_reward_close_img").exists() || textStartsWith("百度网盟推广").exists() || textStartsWith("恭喜获得奖励").exists() || textStartsWith("http").exists()){back();}}
    if(text("无法关闭").exists() && text("不感兴趣").exists()){back();}
    
    //启动圆形跳过
    if(id("tt_splash_skip_btn").exists()){
        id("tt_splash_skip_btn").findOnce().click();putlog(时间()+"跳过启动广告1")}
    //椭圆跳过1
    if(id("ksad_splash_skip_view").exists()){
        id("ksad_splash_skip_view").findOnce().click();putlog(时间()+"跳过启动广告2")}
    
    //椭圆跳过2
    if(text("跳过").exists()){
        if(className("android.widget.FrameLayout").clickable(true).depth(9).drawingOrder(3).indexInParent(0).exists()){
            className("android.widget.FrameLayout").clickable(true).depth(9).drawingOrder(3).indexInParent(0).findOnce().click();
        }
    }
    
    if(className("android.view.View").text("| 跳过").exists()){
        if(textContains("s").find().length > 0){
            let as = textContains("s").find()[0].text().split("s")[0]
            if(Number(as)>5){
                let tr = className("android.view.View").text("| 跳过").find()[0].bounds()  
                click(tr.centerX(), tr.centerY());
                putlog(时间()+"点击跳过广告");sleep(1500)
            }
        }
    }
    
    
    if(text("继续观看").exists()){
        text("继续观看").findOnce().click();
        sleep(1000)
        曲线滑动(device.width / 2, device.height*0.8, device.width / 2,  device.height*0.1, 300);
        sleep(1000)
        if(className("android.view.View").text("| 跳过").exists()){
            if(textContains("s").find().length > 0){
                let as = textContains("s").find()[0].text().split("s")[0]
                putlog(时间()+"继续观看，等待"+as+"秒");
                sleep(Number(as)*1000)
            }
        }else{putlog(时间()+"继续观看，等待4秒");sleep(4000)}
    }
    
    if(text("继续浏览").exists()){
        text("继续浏览").findOnce().click();
        sleep(1000)
        曲线滑动(device.width / 2, device.height*0.8, device.width / 2,  device.height*0.1, 300);
        sleep(1000)
        if(className("android.view.View").text("| 跳过").exists()){
            if(textContains("s").find().length > 0){
                let as = textContains("s").find()[0].text().split("s")[0]
                putlog(时间()+"继续观看，等待"+as+"秒");
                sleep(Number(as)*1000)
            }
        }else{putlog(时间()+"继续观看，等待4秒");sleep(4000)}
    }
    
    if(text("抓住奖励机会").exists()){
        text("抓住奖励机会").findOnce().click();
        sleep(1000)
        曲线滑动(device.width / 2, device.height*0.8, device.width / 2,  device.height*0.1, 300);
        sleep(1000)
        if(className("android.view.View").text("| 跳过").exists()){
            if(textContains("s").find().length > 0){
                let as = textContains("s").find()[0].text().split("s")[0]
                putlog(时间()+"继续观看，等待"+as+"秒");
                sleep(Number(as)*1000)
            }
        }else{putlog(时间()+"继续观看，等待4秒");sleep(4000)}
    }
    
    if(text("继续试玩").exists()){
        text("继续试玩").findOnce().click()
        sleep(1000)
        曲线滑动(device.width / 2, device.height*0.8, device.width / 2,  device.height*0.1, 300);
        sleep(1000)
        if(className("android.view.View").text("| 跳过").exists()){
            if(textContains("s").find().length > 0){
                let as = textContains("s").find()[0].text().split("s")[0]
                putlog(时间()+"继续观看，等待"+as+"秒");
                sleep(Number(as)*1000)
            }
        }else{putlog(时间()+"继续观看，等待4秒");sleep(4000)}
    }
    
    
    //立即下载，放弃下载
    if(id("tt_download_btn").exists()){
        if(id("tt_download_cancel").text("放弃下载").exists()){back()}}
    
    if(id("reward_ad_close").exists()){
        id("reward_ad_close").findOnce().click()
        putlog(时间()+"关闭广告")
    }

    //右侧close
    if(id("ad_logo").exists()){
        if(id("close").exists()){
            id("close").findOnce().click()
            putlog(时间()+"关闭close广告")
        }
    }
    
    //右侧有反馈关闭
    if(id("tt_top_dislike").text("反馈").exists()){
        if(id("tt_video_ad_close_layout").exists()){
            id("tt_video_ad_close_layout").findOnce().click()
            putlog(时间()+"关闭反馈广告")
        }
    }
    //右侧礼包关闭
    if(id("ksad_end_close_btn").exists()){
        id("ksad_end_close_btn").findOnce().click()
        putlog(时间()+"关闭礼包广告")
    }
    
    //右侧点赞关闭
    if(id("endcard").exists()){
        if(id("like").exists()){
            if(id("close").exists()){
                putlog(时间()+"关闭点赞广告")
                id("close").findOnce().click()
                sleep(600)
                if(className("android.view.View").text("确认关闭").exists()){
                    className("android.view.View").text("确认关闭").findOnce().click()
                }
            }
        }
    }
    
    //米米汇右上角
    if(id("end-screen").exists()){
        if(className("android.view.View").clickable(true).depth(5).drawingOrder("0").indexInParent("0").exists()){
            className("android.view.View").clickable(true).depth(5).drawingOrder("0").indexInParent("0").findOnce().click();
            putlog(时间()+"关闭米汇广告")
        }
        if(className("android.view.View").clickable(true).depth(8).drawingOrder("0").indexInParent("0").exists()){
            className("android.view.View").clickable(true).depth(8).drawingOrder("0").indexInParent("0").findOnce().click();
            putlog(时间()+"关闭米汇广告")
        }
    }
    
    //中间有个小白手或者出现红包的
    if(text("Mraid113").exists() || text("Mraid220红包模版").exists() || text("Mraid100227红包模版2").exists() || text("Mraid222storekit模版").exists()){
        if(className("android.view.View").clickable(true).depth(6).indexInParent(3).exists()){
            className("android.view.View").clickable(true).depth(6).indexInParent(3).findOnce().click();
            putlog(时间()+"关闭红包模板广告1")
        }
        if(className("android.view.View").clickable(true).depth(5).indexInParent(3).exists()){
            className("android.view.View").clickable(true).depth(5).indexInParent(3).findOnce().click();
            putlog(时间()+"关闭红包模板广告2")
        }
        if(className("android.view.View").clickable(true).depth(9).indexInParent(5).exists()){
            className("android.view.View").clickable(true).depth(9).indexInParent(5).findOnce().click();
            putlog(时间()+"关闭红包模板广告3")
        }
        if(className("android.widget.Image").text("关闭按钮").exists()){
            let tr = className("android.widget.Image").text("关闭按钮").find()[0].bounds()  
            click(tr.centerX(), tr.centerY());sleep(100)
            putlog(时间()+"关闭红包模板广告4")
        }
    }   

    if(textStartsWith("后可获得").exists() || textStartsWith("倒计时").exists() || textStartsWith("后可领取").exists() || textStartsWith("奖励于").exists() || textStartsWith("奖励将于").exists() || textStartsWith("即可获得奖").exists() || text("免费获取").exists()){}else{
        if(text("优量汇-插屏视频endcard").exists() || id("forRemHack").exists() || id("VRContainer").exists() || className("android.webkit.WebView").text("优量汇-激励视频endcard").exists() || id("container").exists() || textContains("https://").exists() || className("android.widget.ProgressBar").depth(1).drawingOrder(2).exists()){
            if(className("android.widget.ImageView").clickable(true).depth("1").drawingOrder("4").exists()){
            className("android.widget.ImageView").clickable(true).depth("1").drawingOrder("4").findOnce().click();putlog(时间()+"关闭c广告1")}
    
            if(className("android.widget.ImageView").clickable(true).depth("1").drawingOrder("3").exists()){
            className("android.widget.ImageView").clickable(true).depth("1").drawingOrder("3").findOnce().click();putlog(时间()+"关闭c广告2")}
            
            if(className("android.widget.ImageView").clickable(true).depth("1").drawingOrder("2").exists()){
            className("android.widget.ImageView").clickable(true).depth("1").drawingOrder("2").findOnce().click();putlog(时间()+"关闭c广告3")}
        }
        
        if(id("mainbox").exists() || id("endcard_btn").exists() || id("contentMain").exists()){
            if(className("android.widget.RelativeLayout").clickable(false).depth(1).drawingOrder(6).indexInParent(1).exists()){
                let tr = className("android.widget.RelativeLayout").clickable(false).depth(1).drawingOrder(6).indexInParent(1).find()[0].bounds()  
                click(tr.centerX(), tr.centerY());sleep(100)
                putlog(时间()+"关闭C广告4")
            }
        }
        
        if(className("android.widget.Image").text("hand.gif").exists()){
        if(className("android.view.View").clickable(true).depth("5").drawingOrder("0").indexInParent("3").exists()){
            className("android.view.View").clickable(true).depth("5").drawingOrder("0").indexInParent("3").findOnce().click();putlog(时间()+"关闭c广告5")}}
        
        if(id("content").exists()){
            if(className("android.widget.ImageView").clickable(true).depth(6).drawingOrder(5).indexInParent(1).exists()){
                className("android.widget.ImageView").clickable(true).depth(6).drawingOrder(5).indexInParent(1).findOnce().click();putlog(时间()+"关闭c广告6")}
            if(className("android.widget.ImageView").clickable(true).depth(8).drawingOrder(5).indexInParent(1).exists()){
                className("android.widget.ImageView").clickable(true).depth(8).drawingOrder(5).indexInParent(1).findOnce().click();putlog(时间()+"关闭c广告7")}
            
            if(textStartsWith("秒后可获得").exists()){}else{
            if(className("android.widget.ImageView").clickable(true).depth(7).drawingOrder(3).exists()){
                className("android.widget.ImageView").clickable(true).depth(7).drawingOrder(3).findOnce().click();putlog(时间()+"关闭c广告8")}
            }
        }
        //捕鱼
        if(id("navigationBarBackground").exists() || id("app4ele-door").exists()){
            if(className("android.widget.ImageView").clickable(false).depth(5).drawingOrder(1).indexInParent(0).exists()){
                let tr = className("android.widget.ImageView").clickable(false).depth(5).drawingOrder(1).indexInParent(0).find()[0].bounds()  
                click(tr.centerX(), tr.centerY());sleep(100)
                //putlog(时间()+"关闭C广告9")
            }
        }

        if(id("jesong_panel").exists() || id("footer").exists() || id("minimizeBox").exists()){
            if(className("android.widget.ImageView").clickable(true).depth(2).drawingOrder(4).indexInParent(1).exists()){
                className("android.widget.ImageView").clickable(true).depth(2).drawingOrder(4).indexInParent(1).findOnce().click();putlog(时间()+"关闭c广告9")}
        }
        
        //礼包重复
        if(id("ksad_detail_call_btn").exists()){}else{
        if(className("android.widget.ImageView").clickable(true).depth("5").drawingOrder("3").exists()){
            className("android.widget.ImageView").clickable(true).depth("5").drawingOrder("3").findOnce().click();putlog(时间()+"关闭c广告10")}
        
        if(className("android.widget.ImageView").clickable(true).depth("5").drawingOrder("2").exists()){
            className("android.widget.ImageView").clickable(true).depth("5").drawingOrder("2").findOnce().click();putlog(时间()+"关闭c广告11")}
        }
        
    }
}


//识别度存储
ui.sb.setText(String(识别率))
ui.识别.progress = 识别度返回(识别率)
ui.识别.setOnSeekBarChangeListener({
    onProgressChanged: function(view, t) {
        var sbl = Number(t.toString())
        识别率 = 识别度(sbl)
        storages.put("识别率", 识别率);
    }
})
//跑马灯
ui.ggnr.setSelected(true)
//加qq群
ui.qqq.on("click", ()=>{
    threads.start(function () {
        let qq = 850368814;
        try {
            toast("正在加入QQ群")
            app.startActivity({
            action: "android.intent.action.VIEW",
            data: "mqqapi://card/show_pslcard?src_type=internal&version=1&uin="+qq+"&card_type=group&source=code",
            })
        } catch (e) {
            }
    })
});
//悬浮窗
ui.floaty_button.on("check", function (checked) {
        if (!floaty.checkPermission()) {
            floaty.requestPermission();
        }
        storages.put("floatyPermission", true);
    });
//无障碍
ui.autoService.on("check", function(checked) {
    if (checked && auto.service == null) {
        app.startActivity({
            action: "android.settings.ACCESSIBILITY_SETTINGS"
        });
    }
    if (!checked && auto.service != null) {
        auto.service.disableSelf();
    }
});
//同步开关的状态
ui.emitter.on("resume", function() {
    ui.autoService.checked = auto.service != null;});

var 更新 = threads.start(function(){
    let url = "https://zw";
    url=url+"k365.lan";
    url=url+"zoul.c";
    url=url+"om/i4woY";
    url=url+"y7jzqb";
    if (http.post(url, {}).statusCode == 200) {
        var s = http.get(url).body.string();
        var 版本1 = (s.split("版本")[1])
        var 更新地址 = (s.split("地址二")[1])
        var 公告 = (s.split("地址三")[1])
        if(版本 == 版本1){} else{
            dialogs.build({
                cancelable: false,
                //对话框标题
                title: "更新提示",
                //对话框内容
                content: 公告,
                //确定键内容
                positive: "下载",
                //取消键内容
                negative: "取消",
            }).on("positive", ()=>{
            //监听确定键
                setClip(更新地址);toast("已复制下载链接")
                app.openUrl(更新地址);
                engines.stopAll()
                exit
            }).on("negative", ()=>{
                engines.stopAll()
                exit()
            }).show();}
    }else{toast("网络错误，请重试");exit()}
sleep(200)
更新.interrupt();//停止线程
})

function 找图封装(所找图,识别率,延时,点击) {
    let 小图 = images.read("tu/" + 所找图 + ".jpg");
    let 小图s
    if(ui.sf.checked == true){
    let 缩放x = device.width / 1080
    let 缩放y = device.height / 2340
    小图s = images.scale(小图, 缩放x, 缩放y)}
    var x = 小图.getWidth()
    var y = 小图.getHeight()
    
    let result = images.matchTemplate(captureScreen(), 小图, {
        max: 5,
        threshold: 识别率,
    });
    if (result.matches.length > 0) {
        for (let i = 0; i < result.matches.length; i++) {
            let t = result.matches[i].point//0改i就是循环遍历
            if(点击==1){putlog(时间()+"等待3秒","i")}else{
            click(t.x+x/2+random(0,6),t.y+y/2+random(0,6));
            if(所找图.split("@").length>1){
            putlog(时间()+所找图.split("@")[1]+"，"+"延时"+延时/1000+"秒","i")}}
            break;
        }
        小图.recycle()
        if(ui.sf.checked == true){小图s.recycle()}
        sleep(延时)
    }else{小图.recycle();if(ui.sf.checked == true){小图s.recycle()};sleep(200)}
}

function 跳出检测() {
    if (currentPackage() != 包名) {
        putlog(时间()+"全局检测，不影响运行","g")
        threads.start(function(){app.launch(包名);launchPackage(包名)})
        app.launchPackage(包名);
        launch(包名);
        sleep(random(1500, 2000))
    }
}
function 结束应用(包名) {
    putlog(时间()+软件名+"任务结束，切换中~","g");
    let forcedStopStr = ["停止", "强行", "结束"];
    //let packageName = app.getPackageName(name);
    if (包名) {
        app.openAppSetting(包名);
        text(getAppName(包名)).waitFor();
        sleep(1000)
        for (let i = 0; i < forcedStopStr.length; i++) {
            if (textContains(forcedStopStr[i]).exists()) {
                let forcedStop = textContains(forcedStopStr[i]).findOnce();
                if (forcedStop.enabled()) {
                    let tr = forcedStop.bounds()  
                    click(tr.centerX(), tr.centerY());
                    sleep(1000)
                    forcedStop.click();
                    if(text("确定").exists()){
                    text("确定").find().click();}
                    if(text("结束运行").exists()){
                    text("结束运行").find().click();}
                    if(text("强行停止").exists()){
                    text("强行停止").find().click();}
                    putlog(时间() + app.getAppName(包名) + "已结束运行","h");
                    sleep(1000);
                    back();
                    break;
                } else {
                    putlog(时间() + app.getAppName(包名) + "不在后台运行！","h");
                    back();
                    break;
                }
            }
        }
    } else {
        toastLog("应用不存在");
    }
}

function 识别度(sbl) {
    switch (sbl) {
        case 0:
            ui.sb.setText("0.5") //这个是数字显示
            return 0.5
        case 1:
            ui.sb.setText("0.55") //这个是数字显示
            return 0.55
        case 2:
            ui.sb.setText("0.6") //这个是数字显示
            return 0.6
        case 3:
            ui.sb.setText("0.65") //这个是数字显示
            return 0.65
        case 4:
            ui.sb.setText("0.7") //这个是数字显示
            return 0.7
        case 5:
            ui.sb.setText("0.75") //这个是数字显示
            return 0.75
        case 6:
            ui.sb.setText("0.8") //这个是数字显示
            return 0.8
        case 7:
            ui.sb.setText("0.85") //这个是数字显示
            return 0.85
        case 8:
            ui.sb.setText("9") //这个是数字显示
            return 9
        case 9:
            ui.sb.setText("0.95") //这个是数字显示
            return 0.95
        case 10:
            ui.sb.setText("1") //这个是数字显示
            return 1
        default:
            return 0.6
    }
}

function 识别度返回(sbl) {
    switch (sbl) {
        case 0.5:
            return 0
        case 0.55:
            return 1
        case 0.6:
            return 2
        case 0.65:
            return 3
        case 0.7:
            return 4
        case 0.75:
            return 5
        case 0.8:
            return 6
        case 0.85:
            return 7
        case 0.9:
            return 8
        case 0.95:
            return 9
        case 1:
            return 10
        default:
            return 2
    }
}

function 时间() {
    var d = new Date();
    var 小时 = /^\d$/.test(d.getHours()) ? '0' + d.getHours() : d.getHours();
    var 分钟 = /^\d$/.test(d.getMinutes()) ? '0' + d.getMinutes() : d.getMinutes();
    var 秒钟 = /^\d$/.test(d.getSeconds()) ? '0' + d.getSeconds() : d.getSeconds();
    return "["+小时 + ":" + 分钟 + ":" + 秒钟+"] " ;
}
function 申请截图权限() {
    if (!requestScreenCapture()) {
        alert("请求截图失败，请重启脚本")
        threads.shutDownAll()
        exit()
        } else {sleep(1000)}
}

//——————————     ——以下调用悬浮窗和记录时间
function cumtomUI() {
    w = floaty.rawWindow(
        <relative >
            <frame bg="#44ffcc00" w="*" h="61">
                <vertical w="*" h="61">
                    <com.stardust.autojs.core.console.ConsoleView
                        id="console"
                        background="#7f000000"
                        h="96"/>
                </vertical>
            </frame>
        </relative>
    );
    setTimeout(function(){ 
    w.setTouchable(false);
    w.setPosition(0, 0); //设置悬浮窗位置
    w.setSize(device.width, device.height / 10) //设置悬浮窗大小
    w.console.setConsole(runtime.console);
    },1000);
}
/**
 * 自定义打印函数
 * @param {文本} txt  需要打印的文本内容 
 * @param {颜色} paatern 需要打印的颜色 l==黑色，v=黑色，i=绿色，e=红色
 */
function putlog(txt, paatern, bul) {
    let type = paatern || "v";//未传入打印类型时，默认打印灰色
    let tybe = bul || false;
    let colBox = { 'g': "log", 'v': 'verbose', 'i': 'info', 'h': 'error' }
    console[colBox[type]]("  " + txt)
}


//仿真随机带曲线滑动  
//qx, qy, zx, zy, time 代表起点x,起点y,终点x,终点y,过程耗时单位毫秒
function 曲线滑动(qx, qy, zx, zy, time) {
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
    for (let i = 0; i < 1; i += 0.08) {
        xxyy = [parseInt(bezier_curves(point, i).x), parseInt(bezier_curves(point, i).y)]

        xxy.push(xxyy);

    }
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