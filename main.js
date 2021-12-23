"ui";
var 安卓版本 = device.release.split(".")[0];
var storage = storages.create("外快大合集"); //创建本地储存
var zwk_kami="";
var screenHeight = device.height;
storage.put("screenHeight",screenHeight);

//--------------------作者/软件信息------------------------
//开发者ID  (后台 左上角头像下方的ID)
var DeveloperID = "14273";
storage.put("DeveloperID","14273");
//API 密码 (后台 设置中的 接口安全密码)
var ApiPassword = "854855";
storage.put("ApiPassword","854855");
//软件名称
var SoftwareName = "zwktyjb";
storage.put("SoftwareName","zwktyjb");
var deadLine="";
var version=24;
var versionName="v3.14";
storage.put("versionName",versionName);

//卡密
var CDK = "";
//--------------------------------------------
/**
 * CDK登陆
 */
 function CDKLogin() {
    //退出上一次的Needle
    var logoutResult = LogoutNeedle();
    console.log(logoutResult[1]);
    var loginResult = SendQLRequest(
      "apiv3/card_login",
      "card=" + CDK + "&software=" + SoftwareName);
   
    if (loginResult[0]) {
      var successData = loginResult[1];
      var endTime = successData["endtime"];
      var lessTime = successData["less_time"];
      var needle = successData["needle"];
   
      PutSt("oldNeedle", needle); //存储本次 的Needle
      toastLog("登录成功！");
      console.log(needle + "登陆成功");
      zhuye();
      threads.start(function() {
        SendHeartbeat(needle);
      });
    } else {
      var failResult = loginResult[1];
      console.warn("CDKLogin FailMsg:" + failResult);
      console.warn("所有线程已经停止!");
      toastLog("卡密错误，请联系 QQ：3093074221获取卡密.");
      threads.shutDownAll(); //停止所有线程
      exit();
    }
  }
   
  /**
   * 退出上一次的Needle
   */
  function LogoutNeedle() {
    var oldNeedle = GetSt("oldNeedle", "");
   
    if (oldNeedle != "") {
      var logoutResult = SendQLRequest(
        "apiv3/card_logout",
        "card=" + CDK + "&needle=" + oldNeedle);
      if (logoutResult[0]) {
        return [true, oldNeedle + " 退出成功!"];
      } else {
        return [false, oldNeedle & " 退出失败!"];
      }
    } else {
      return [true, "上次无存储的Needle"];
    }
  }
   
  /**
   * 卡密心跳
   * @param {string} cdkNeedle
   */
  function SendHeartbeat(cdkNeedle) {
    do {
      var heartbeatResult = SendQLRequest(
        "apiv3/card_ping",
        "card=" + CDK + "&software=" + SoftwareName + "&needle=" + cdkNeedle);
   
      if (heartbeatResult[0]) {
        var successData = heartbeatResult[1];
   
        var endTime = successData["endtime"];
        var lessTime = successData["less_time"];
        deadLine=lessTime;
        ui.run(()=>{
          ui.deadLineDate.setText(deadLine);
        });
        console.warn("心跳正常. 剩余时间:" + lessTime);
      
        sleep(5 * 60 * 1000); //休息5分钟
      } else {
        var failResult = heartbeatResult[1];
   
        console.warn("Heartbeat FailMsg:" + failResult);
        console.warn("所有线程已经停止!");
        threads.shutDownAll(); //停止所有线程
      }
    } while (true);
  }
   
  /**
   * 访问权朗api
   * @param {string}} api
   * @param {string} apiParams
   */
  function SendQLRequest(api, apiParams) {
    var qlHostArray = [
      "https://napi.2cccc.cc/",
      "https://api2.2cccc.cc/",
      "https://api3.2cccc.cc/"
    ];
    var connectTimes = 0;
    var taoBaoTimeStamp = "";
   
    do {
      connectTimes = connectTimes + 1;
   
      taoBaoTimeStamp = http
        .get("http://api.m.taobao.com/rest/api3.do?api=mtop.common.getTimestamp")
        .body.string();
   
      if (connectTimes > 10) {
        console.log("淘宝时间戳超时");
        return [false, "连接淘宝时间戳服务器失败"];
      }
    } while (taoBaoTimeStamp.substring(2, 5) != "api");
   
    taoBaoTimeStamp = JSON.parse(taoBaoTimeStamp);
    var timeStamp = taoBaoTimeStamp["data"]["t"].substring(0, 10);
    var sign = HexMd5(ApiPassword + "" + timeStamp);
    var common_params =
      "center_id=" + DeveloperID + "&timestamp=" + timeStamp + "&sign=" + sign;
    connectTimes = 0;
    var qlResult = "";
   
    do {
      connectTimes = connectTimes + 1;
   
      qlResult = http
        .get(
          qlHostArray[Math.floor(Math.random() * (3 - 0) + 0)] +
            api +
            "?" +
            common_params +
            "&" +
            apiParams)
        .body.string();
   
      if (connectTimes > 10) {
        return [false, "权朗回执超时"];
      }
    } while (qlResult.substring(2, 6) != "code");
   
    qlResult = JSON.parse(qlResult);
   
    if (qlResult["code"] == "1") {
      if (
        HexMd5(qlResult["timestamp"] + ApiPassword).toUpperCase() ==
          qlResult["sign"].toUpperCase() &&
        Math.abs(timeStamp - qlResult["timestamp"]) < 700
      ) {
        return [true, qlResult["data"]];
      } else {
        return [false, "请检查API密码是否填写正确"];
      }
    } else {
      return [false, qlResult["msg"]];
    }
  }
   
  //--------Helper---------
   
  /**
   * 判断是否 不是 空
   * @param {any}} content 内容
   */
  function IsNotNullOrEmpty(content) {
    return (
      content != null &&
      content != undefined &&
      content != "" &&
      content != " " &&
      content != "  "
    );
  }
   
  /**
   * 存储空间 存入 键值数据
   * @param {string} key 键名
   * @param {any} value 值
   */
  function PutSt(key, value) {
    //   cw(key + " : " + value);
    if (IsNotNullOrEmpty(value)) {
      storage.put(key, value);
    } else {
      //cw("key:" + key + "----> value为空,跳过保存");
    }
  }
   
  /**
   * 获取 存储控件中的 数据
   * @param {string} key 键名
   * @param {any} defaultValue 默认值
   */
  function GetSt(key, defaultValue) {
    var data = storage.get(key);
    // cw(key + " : " + data);
    if (IsNotNullOrEmpty(data)) {
      return data;
    } else {
      if (defaultValue == undefined) {
        defaultValue = "";
      }
      //cw(key + " : 返回默认值->>" + defaultValue);
      return defaultValue;
    }
  }
  //-------------------------------------
   
  //-------MD5---------------------
  //(autojs 调用java 的MD5方法有bug, 生成出来的是错误的结果.所以用 下面的js md5)
  /**
   * 16进制MD5(常用)
   * @param {any} s
   */
  function HexMd5(s) {
    return binl2hex(core_md5(str2binl(s), s.length * chrsz));
  }
  function B64Md5(s) {
    return binl2str(core_md5(str2binl(s), s.length * chrsz));
  }
  function StrMd5(key, data) {
    return binl2hex(core_hmac_md5(key, data));
  }
  function HexHmacMd5(key, data) {
    return binl2hex(core_hmac_md5(key, data));
  }
  function B64HmacMd5(key, data) {
    return binl2b64(core_hmac_md5(key, data));
  }
  function StrHmacMd5(key, data) {
    return binl2str(core_hmac_md5(key, data));
  }
   
  var hexcase = 0;
  var b64pad = "";
  var chrsz = 8;
  function md5_vm_test() {
    return hex_md5("abc") == "900150983cd24fb0d6963f7d28e17f72";
  }
  function core_md5(x, len) {
    x[len >> 5] |= 0x80 << len % 32;
    x[(((len + 64) >>> 9) << 4) + 14] = len;
    var a = 1732584193;
    var b = -271733879;
    var c = -1732584194;
    var d = 271733878;
    for (var i = 0; i < x.length; i += 16) {
      var olda = a;
      var oldb = b;
      var oldc = c;
      var oldd = d;
      a = md5_ff(a, b, c, d, x[i + 0], 7, -680876936);
      d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
      c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
      b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
      a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
      d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
      c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
      b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
      a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
      d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
      c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
      b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
      a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
      d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
      c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
      b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);
      a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
      d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
      c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
      b = md5_gg(b, c, d, a, x[i + 0], 20, -373897302);
      a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
      d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
      c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
      b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
      a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
      d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
      c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
      b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
      a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
      d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
      c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
      b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);
      a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
      d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
      c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
      b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
      a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
      d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
      c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
      b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
      a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
      d = md5_hh(d, a, b, c, x[i + 0], 11, -358537222);
      c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
      b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
      a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
      d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
      c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
      b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);
      a = md5_ii(a, b, c, d, x[i + 0], 6, -198630844);
      d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
      c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
      b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
      a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
      d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
      c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
      b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
      a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
      d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
      c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
      b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
      a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
      d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
      c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
      b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);
      a = safe_add(a, olda);
      b = safe_add(b, oldb);
      c = safe_add(c, oldc);
      d = safe_add(d, oldd);
    }
    return Array(a, b, c, d);
  }
  function md5_cmn(q, a, b, x, s, t) {
    return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
  }
  function md5_ff(a, b, c, d, x, s, t) {
    return md5_cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function md5_gg(a, b, c, d, x, s, t) {
    return md5_cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function md5_hh(a, b, c, d, x, s, t) {
    return md5_cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function md5_ii(a, b, c, d, x, s, t) {
    return md5_cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function core_hmac_md5(key, data) {
    var bkey = str2binl(key);
    if (bkey.length > 16) bkey = core_md5(bkey, key.length * chrsz);
    var ipad = Array(16),
      opad = Array(16);
    for (var i = 0; i < 16; i++) {
      ipad[i] = bkey[i] ^ 0x36363636;
      opad[i] = bkey[i] ^ 0x5c5c5c5c;
    }
    var hash = core_md5(ipad.concat(str2binl(data)), 512 + data.length * chrsz);
    return core_md5(opad.concat(hash), 512 + 128);
  }
  function safe_add(x, y) {
    var lsw = (x & 0xffff) + (y & 0xffff);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function bit_rol(num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt));
  }
  function str2binl(str) {
    var bin = Array();
    var mask = (1 << chrsz) - 1;
    for (var i = 0; i < str.length * chrsz; i += chrsz)
      bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << i % 32;
    return bin;
  }
  function binl2str(bin) {
    var str = "";
    var mask = (1 << chrsz) - 1;
    for (var i = 0; i < bin.length * 32; i += chrsz)
      str += String.fromCharCode((bin[i >> 5] >>> i % 32) & mask);
    return str;
  }
  function binl2hex(binarray) {
    var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
    var str = "";
    for (var i = 0; i < binarray.length * 4; i++) {
      str +=
        hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xf) +
        hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xf);
    }
    return str;
  }
  function binl2b64(binarray) {
    var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var str = "";
    for (var i = 0; i < binarray.length * 4; i += 3) {
      var triplet =
        (((binarray[i >> 2] >> (8 * (i % 4))) & 0xff) << 16) |
        (((binarray[(i + 1) >> 2] >> (8 * ((i + 1) % 4))) & 0xff) << 8) |
        ((binarray[(i + 2) >> 2] >> (8 * ((i + 2) % 4))) & 0xff);
      for (var j = 0; j < 4; j++) {
        if (i * 8 + j * 6 > binarray.length * 32) str += b64pad;
        else str += tab.charAt((triplet >> (6 * (3 - j))) & 0x3f);
      }
    }
    return str;
  }

function zwk_login() {
    CDK = zwk_kami;
    if(CDK.length<=0){
        toast("请先输入卡密!!");
        exit();
        return;
    }
    CDKLogin();
}

function zhuye(){
    let kami=zwk_kami;
    关闭文件();
    storage.put("卡密",zwk_kami);
    engines.execScriptFile("floatingWindow.js");
    checkUpdate();
}

ui.layout(
    <frame bg="#007ACC">
        <vertical>
            <appbar bg="#20363E">
                <toolbar id="toolbar">
                    <text text="{{storage.get('versionName','v1.0')}}" textSize="18sp" textColor="#ffffff" layout_gravity="left|center_vertical"/>
                    <button text="日志" id="日志" textColor="#ffffff" textSize="18sp" layout_gravity="right|center_vertical" style="Widget.AppCompat.Button.Borderless" />
                </toolbar>
            </appbar>
            
            <viewpager id="viewpager">
                <frame>
                    <scroll>
                        <vertical>
                            
							<card margin="2 5"cardCornerRadius="6dp" alpha="0.6">
                                <vertical margin="5">
									                  <TextView id="jiaqunBtn" text="如需卡密学习，请联系客服QQ：3093074221" textSize="14SP" textColor="#00B0F2" gravity="center" singleLine="true" ellipsize="marquee" focusable="true"/>
                                </vertical>
                            </card>
                            
                            <card margin="2 5"cardCornerRadius="6dp" alpha="0.6">
                                <vertical margin="5">
                                    <text text="1、挂机设置:" textSize="15" textSytle="bold" textColor="#000000"/>
                                    <text text="本脚本支持免ROOT运行！当前安卓版本:{{安卓版本}}【若低于7，则需手机root权限】" marginLeft="5" textSize="10" textColor="#000000"/>
                                    
                                    <horizontal>
                                        <checkbox id="开启快手极速版" text="开启快手极速版" textSize="10"checked="{{storage.get('开启快手极速版',true)}}" marginLeft="5"/>
                                        <text text="单轮刷视频数:" marginLeft="15" textSize="10" textSytle="bold" textColor="#000000"/> 
                                        <input id="快手极速版数量" textColor="#FF4C38" inputType="number" textSize="10"width="100px" paddingLeft="5"  lines="1"  text="{{storage.get('快手极速版数量',50)}}" gravity="center"/>
                                        <text text="个" marginLeft="5" textSize="10" textSytle="bold" textColor="#000000"/> 
                                        <button id="快手极速版下载" text="下载" marginLeft="15" textColor="#31ADF1" textSize="10" width="70" height="32" gravity="center"/>
                                    </horizontal>                                   
                                    <horizontal>
                                        <checkbox id="开启抖音极速版" text="开启抖音极速版" textSize="10"checked="{{storage.get('开启抖音极速版',true)}}" marginLeft="5"/>  
                                        <text text="单轮刷视频数:" marginLeft="15" textSize="10" textSytle="bold" textColor="#000000"/> 
                                        <input id="抖音极速版数量" textColor="#FF4C38" inputType="number" textSize="10"width="100px" paddingLeft="5"  lines="1"  text="{{storage.get('抖音极速版数量',50)}}" gravity="center"/>
                                        <text text="个" marginLeft="5" textSize="10" textSytle="bold" textColor="#000000"/> 
                                        <button id="抖音极速版下载" text="下载" marginLeft="15" textColor="#31ADF1" textSize="10" width="70" height="32" gravity="center"/>
                                    </horizontal>                                  
                                    <horizontal>
                                        <checkbox id="开启抖音火山版" text="开启抖音火山版" textSize="10"checked="{{storage.get('开启抖音火山版',true)}}" marginLeft="5"/>  
                                        <text text="单轮刷视频数:" marginLeft="15" textSize="10" textSytle="bold" textColor="#000000"/> 
                                        <input id="抖音火山版数量" textColor="#FF4C38" inputType="number" textSize="10"width="100px" paddingLeft="5"  lines="1"  text="{{storage.get('抖音火山版数量',50)}}" gravity="center"/>
                                        <text text="个" marginLeft="5" textSize="10" textSytle="bold" textColor="#000000"/> 
                                        <button id="抖音火山版下载" text="下载" marginLeft="15" textColor="#31ADF1" textSize="10" width="70" height="32" gravity="center"/>                                                                     
                                    </horizontal> 
                                    <horizontal>
                                        <checkbox id="开启喜刷刷视频" text="开启喜刷刷视频" textSize="10"checked="{{storage.get('开启喜刷刷视频',true)}}" marginLeft="5"/>  
                                        <text text="单轮刷视频数:" marginLeft="15" textSize="10" textSytle="bold" textColor="#000000"/> 
                                        <input id="喜刷刷视频数量" textColor="#FF4C38" inputType="number" textSize="10"width="100px" paddingLeft="5"  lines="1"  text="{{storage.get('喜刷刷视频数量',50)}}" gravity="center"/>
                                        <text text="个" marginLeft="5" textSize="10" textSytle="bold" textColor="#000000"/> 
                                        <button id="喜刷刷视频下载" text="下载" marginLeft="15" textColor="#31ADF1" textSize="10" width="70" height="32" gravity="center"/>                                                                     
                                    </horizontal> 
                                    <horizontal>
                                        <checkbox id="开启百度极速版" text="开启百度极速版" textSize="10"checked="{{storage.get('开启百度极速版',true)}}" marginLeft="5"/>  
                                        <text text="单轮刷视频数:" marginLeft="15" textSize="10" textSytle="bold" textColor="#000000"/> 
                                        <input id="百度极速版数量" textColor="#FF4C38" inputType="number" textSize="10"width="100px" paddingLeft="5"  lines="1"  text="{{storage.get('百度极速版数量',50)}}" gravity="center"/>
                                        <text text="个" marginLeft="5" textSize="10" textSytle="bold" textColor="#000000"/> 
                                        <button id="百度极速版下载" text="下载" marginLeft="15" textColor="#31ADF1" textSize="10" width="70" height="32" gravity="center"/>
                                    </horizontal> 
                                    <horizontal>
                                        <checkbox id="开启火火极速版" text="开启火火极速版" textSize="10"checked="{{storage.get('开启火火极速版',true)}}" marginLeft="5"/>  
                                        <text text="单轮刷视频数:" marginLeft="15" textSize="10" textSytle="bold" textColor="#000000"/> 
                                        <input id="火火极速版数量" textColor="#FF4C38" inputType="number" textSize="10"width="100px" paddingLeft="5"  lines="1"  text="{{storage.get('火火极速版数量',50)}}" gravity="center"/>
                                        <text text="个" marginLeft="5" textSize="10" textSytle="bold" textColor="#000000"/> 
                                        <button id="火火视频极速版下载" text="下载" marginLeft="15" textColor="#31ADF1" textSize="10" width="70" height="32" gravity="center"/>
                                    </horizontal>
                                    <horizontal>
                                        <checkbox id="开启彩蛋视频" text="开启彩蛋短视频" textSize="10" checked="{{storage.get('开启彩蛋视频',true)}}" marginLeft="5"/>
                                        <text text="单轮刷视频数:" marginLeft="15" textSize="10" textSytle="bold" textColor="#000000"/> 
                                        <input id="彩蛋短视频数量" textColor="#FF4C38" inputType="number" textSize="10"width="100px" paddingLeft="5"  lines="1"  text="{{storage.get('彩蛋短视频数量',50)}}" gravity="center"/>
                                        <text text="个" marginLeft="5" textSize="10" textSytle="bold" textColor="#000000"/> 
                                        <button id="彩蛋视频下载" text="下载" marginLeft="15" textColor="#31ADF1" textSize="10" width="70" height="32" gravity="center"/>
                                    </horizontal>
                                    <horizontal>
                                        <text text="单个视频播放随机时长:" marginLeft="10" textSize="10" textSytle="bold" textColor="#000000"/> 
                                        <input id="最短时长" inputType="number" textColor="#FF4C38" textSize="10"width="100px" paddingLeft="5"  lines="1" text="{{storage.get('最短时长',5)}}" gravity="center"/>
                                        <text text="~" marginLeft="5" textSize="10" textSytle="bold" textColor="#000000"/> 
                                        <input id="最长时长" inputType="number" textColor="#FF4C38" textSize="10" width="100px" paddingLeft="5"  lines="1" text="{{storage.get('最长时长',15)}}" gravity="center"/>
                                        <text text="秒" marginLeft="5" textSize="10" textSytle="bold" textColor="#000000"/> 
                                    </horizontal>
                                    <horizontal>
                                        <text text="滑动坐标参数: x1=" marginLeft="10" textSize="10" textSytle="bold" textColor="#000000"/> 
                                        <input id="startX" textColor="#FF4C38" text="{{storage.get('startX',5)}}" paddingLeft="5" w="25" textSize="10" lines="1" gravity="center"/> 
                                        <text text=", y1={{storage.get('screenHeight',screenHeight)}}*" textSize="10" textSytle="bold" textColor="#000000"/>
                                        <input id="startY" textColor="#FF4C38" text="{{storage.get('startY',0.3)}}" paddingLeft="5" w="25" textSize="10" lines="1" gravity="center"/> 
                                        <text text="; x2=" textSize="10" textSytle="bold" textColor="#000000"/>
                                        <input id="endX" textColor="#FF4C38" text="{{storage.get('endX',5)}}" paddingLeft="5" w="25" textSize="10" lines="1" gravity="center"/> 
                                        <text text=", y2={{storage.get('screenHeight',screenHeight)}}*" textSize="10" textSytle="bold" textColor="#000000"/>
                                        <input id="endY" textColor="#FF4C38" text="{{storage.get('endY',0.7)}}" paddingLeft="5" w="25" textSize="10" lines="1" gravity="center"/> 
                                    </horizontal>
                                    <horizontal>
                                        <text text="屏幕滑动延时:" marginLeft="10" textSize="10" textSytle="bold" textColor="#000000"/> 
                                        <input id="screenDuration" textColor="#FF4C38" text="{{storage.get('screenDuration',10)}}" paddingLeft="5" w="50" textSize="10" lines="1" gravity="center"/> 
                                        <text text="毫秒" marginLeft="10" textSize="10" textSytle="bold" textColor="#000000"/> 
                                    </horizontal>
                                    <horizontal>
                                        <text text="卡密剩余时间:" marginLeft="10" textSize="10" textSytle="bold" textColor="#000000"/> 
                                        <input id="deadLineDate" text="0天" paddingLeft="5" w="200" textSize="10" lines="1" gravity="left"/> 
                                    </horizontal>
                                    <horizontal>
                                        <Switch id="autoService" text="无障碍模式" w="auto" checked="{{auto.service != null}}" padding="8 8 8 8" textSize="10sp"/>
                                        <Switch id="开启养号模式" text="开启养号模式" w="auto" checked="{{storage.get('开启养号模式',true)}}" padding="8 8 8 8" textSize="10sp"/>
                                    </horizontal>

                                    <text text="2、卡密验证:" textSize="15" textSytle="bold" textColor="#000000"/>
                                    <vertical>
                                      <input id="login_km" paddingLeft="5" textSize="15" hint="请联系QQ：286911338 获取卡密" lines="1" text="{{storage.get('卡密','')}}" gravity="left" textColor="#FF0000"/>
                                      <button id="start" text="启动脚本" textSize="15"/>
                                    </vertical>
                                </vertical>
                            </card>
                        </vertical>
                    </scroll>
                </frame>
            </viewpager>
        </vertical>
    </frame>
);
activity.setSupportActionBar(ui.toolbar);
mianze();
ui.start.click(function() {
    storage.put("开启抖音极速版",ui.开启抖音极速版.checked);
    storage.put("抖音极速版数量",ui.抖音极速版数量.text());

    storage.put("开启快手极速版",ui.开启快手极速版.checked);
    storage.put("快手极速版数量",ui.快手极速版数量.text());

    storage.put("开启抖音火山版",ui.开启抖音火山版.checked);
    storage.put("抖音火山版数量",ui.抖音火山版数量.text());

    storage.put("开启百度极速版",ui.开启百度极速版.checked);
    storage.put("百度极速版数量",ui.百度极速版数量.text());

    storage.put("开启火火极速版",ui.开启火火极速版.checked);
    storage.put("火火极速版数量",ui.火火极速版数量.text());

    storage.put("开启彩蛋视频",ui.开启彩蛋视频.checked);
    storage.put("彩蛋短视频数量",ui.彩蛋短视频数量.text());

    storage.put("开启喜刷刷视频",ui.开启喜刷刷视频.checked);
    storage.put("喜刷刷视频数量",ui.喜刷刷视频数量.text());

    storage.put("startX",ui.startX.text());
    storage.put("startY",ui.startY.text());
    storage.put("endX",ui.endX.text());
    storage.put("endY",ui.endY.text());
    storage.put("screenDuration",ui.screenDuration.text());
    
    storage.put("最短时长",ui.最短时长.text());
    storage.put("最长时长",ui.最长时长.text());

    storage.put('开启养号模式',ui.开启养号模式.checked);

    threads.start(function() {
		    zwk_kami=ui.login_km.text()
        zwk_login();
    });
})

function checkUpdate(){
  threads.start(function(){
    var updateRes=SendQLRequest('apiv3/version',"software=" + SoftwareName +"&version="+version);
    console.log("updateRes:"+updateRes);
    if(!updateRes[0]){
      var updateInfo=updateRes[1];
      console.log("updateInfo:"+updateInfo);
      if(updateInfo){
        var msgArr=updateInfo.split("，");
        console.log("msgArr:"+msgArr);
        if(msgArr[1]){
          var msgArr1=msgArr[1].split("【");
          console.log("msgArr1:"+msgArr1);
          if(msgArr1[1]){
            var msgArr2=msgArr1[1].split("】");
            console.log("msgArr2:"+msgArr2);
            var msgArr3=msgArr2[0].split(",");
            console.log("msgArr3:"+msgArr3);
            var msg=msgArr3[0];
            console.log("msg:"+msg);
            try {
              if(msg){
                ui.run(()=>{
                  dialogs.build({
                    title: "更新检查",
                    titleColor: "black",
                    content: "检测到软件有新版本，是否前往下载最新版软件？",
                    contentColor: "black",
                    cancelable: true,
                    positive: "更新",
                    positiveColor: "#1E1E1E",
                    negative: "不更新",
                    negativeColor: "#1E1E1E"
                  }).on("positive", () => {
                      console.log("更新");
                      toastLog("请联系QQ：286911338 获取新版本！！");
                  }).on("negative", () => {
                      console.log("不更新");
                  }).show();
                });
              }
            } catch (error) {
              console.log("捕获错误3：",errer);
            }
          }
        }
      }
    }
  });
}

function mianze(){
    let tipMianze=storage.get("免责声明",false);
    if(!tipMianze){
        dialogs.build({
            title: "免责声明",
            titleColor: "black",
            content: "本软件仅供学习交流使用，禁止售卖、破解及使用参与任何违法活动！一切因售卖、破解及使用本软件造成的任何后果，作者概不负责，亦不承担任何法律责任！如不同意，请立即卸载本软件！！一旦安装使用本软件，即默认你同意以上免责条款！！",
            contentColor: "black",
            cancelable: true,
            positive: "同意",
            positiveColor: "#3ADD57",
            negative: "不同意",
            negativeColor: "#FF0000"
        }).on("positive", () => {
            console.log("同意");
            storage.put("免责声明",true);
            checkUpdate();
        }).on("negative", () => {
            console.log("不同意");
            exit();
        }).show();
    }else{
        console.log("已经同意免责声明");
        checkUpdate();
    }
}

function 关闭文件() {
    let j = engines.all()
    for (let i in j) {
        let dx = j[i]
        let pd = "" + dx.source
        if (pd.match("floatingWindow.js")) {
            log("关闭脚本对象")
            j[i].forceStop()
        }
    }
}

ui.autoService.click(function() {
    if (auto.service == null) {
        app.startActivity({
            action: "android.settings.ACCESSIBILITY_SETTINGS"
        });
    }
    if (auto.service != null) {
        auto.service.disableSelf();
    }
});

ui.日志.click(function() {
    app.startActivity('console');
})

threads.start(function() {
  try{
    var gongGaoRes=SendQLRequest("apiv3/inform","software=" + SoftwareName);
    if(gongGaoRes[0]){
      var gongGaoSuccess=gongGaoRes[1];
      var inform=gongGaoSuccess["inform"];
      ui.run(()=>{
        ui.jiaqunBtn.setText(inform);
      });
    }
  }catch(error){
    console.log("捕获错误：",error);
  }
});

ui.jiaqunBtn.setSelected(true);

ui.jiaqunBtn.click(function(){
    app.openUrl("http://zwk365.com/EjZJwIyZXGUoS4WA");
});

ui.快手极速版下载.click(function(){
    app.openUrl("https://zwk365.com/hZSxnsb9");
});

ui.抖音极速版下载.click(function(){
    app.openUrl("https://zwk365.com/eVNHN4qW");
});

ui.抖音火山版下载.click(function(){
  app.openUrl("https://zwk365.com/TWQ6yXZNWSPK1lAB");
});

ui.百度极速版下载.click(function(){
  app.openUrl("http://zwk365.com/uSCYaKx0Wzs58dPd");
});

ui.彩蛋视频下载.click(function(){
  app.openUrl("https://zwk365.com/DOOuoOQbLIyALcQc");
});

ui.火火视频极速版下载.click(function(){
  app.openUrl("https://zwk365.com/ZHZurWsuMjcgx3qb");
});

ui.喜刷刷视频下载.click(function(){
  app.openUrl("http://zwk365.com/sxbgnwQdqQ3jw203");
});

// 当用户回到本界面时，resume事件会被触发
ui.emitter.on("resume", function() {
    ui.autoService.checked = auto.service != null;
    toastLog("回到主界面，关闭所有程序")
    threads.shutDownAll();
});

var kg = false
ui.emitter.on("back_pressed", e => {
    if (!kg) {
        kg = true;
        toastLog("再按一次退出");
        setTimeout(() => {
            kg = false;
        }, 500);
        e.consumed = true;
    } else {
        e.consumed = false;
    };
})

function MD5(string) {
    var res = java.math.BigInteger(1, java.security.MessageDigest.getInstance("MD5").digest(java.lang.String(string).getBytes())).toString(16);
    while (res.length < 32) res = "0" + res;
    return res;
}