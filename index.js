var through = require('through2');
var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var ejs = require('ejs');

var reg = /"(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|(\/\/[^\r\n\f]+|\/\*[\s\S]*?(?:\*\/|$))|\b(__inline|__template)\s*\(\s*("(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*')\s*\)/g;

var ejsConfig = {
    client:true,
    debug:false,
    _with:false,
    compileDebug:false
}

module.exports = function (options) {
    return through.obj(function (file, enc, cb) {

        // 如果文件为空，不做任何操作，转入下一个操作，即下一个 .pipe()
        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        // 插件不支持对 Stream 对直接操作，跑出异常
        if (file.isStream()) {
            this.emit('error', new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
            return cb();
        }

        // 将文件内容转成字符串经行文本替换
        // 然后将处理后的字符串，再转成Buffer形式
        var content = file.contents.toString();
        content = content.replace(reg, function(m, comment, type, value){
            if(type){
                // console.log(type,value)
                // console.log(file.path)
                var filePath = path.resolve(path.dirname(file.path),value.replace(/['"]/g,''))
                //没有后缀名的默认补.tpl
                if(path.extname(filePath) === ''){
                    filePath += '.tpl'
                }
                if(fs.existsSync(filePath)){
                    switch(type){
                        case '__inline':
                            return JSON.stringify(fs.readFileSync(filePath).toString().replace(/\r\n/g,'\n')) 
                            break;
                        case '__template':
                            return ejs.compile(fs.readFileSync(filePath).toString().replace(/\r\n/g,'\n'),ejsConfig).toString().replace(/function anonymous\(locals, escape(Fn)*, include, rethrow/
,'function(data,escape$1');
                            break;
                    }
                }else{
                    return m;
                }
            }else{
                return m;
            }
        });
        
        file.contents = new Buffer(content);

        this.push(file);
        cb();
    });
};

