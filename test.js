点击控件(id("ft"),"砸金蛋");

function mSecCount(mSec){
    var second=parseInt(mSec/1000);
    SecCount(second);
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