/*!
 * webApp项目总的gulp构建文件
 * 
 * @Author:zhengyuliang
 * @Data: 2016/03/29
 * @Time: 16:24
 */

var gulp = require('gulp'), //必须选引入gulp插件
	del = require('del'), //文件删除
	sass = require('gulp-sass'), //sass编译
	cached = require('gulp-cached'), //缓存当前任务中的文件，只让已修改的文件通过管道
	uglify = require('gulp-uglify'), //js压缩
	rename = require('gulp-rename'), //重命名
	concat = require('gulp-concat'), //合拼文件
	notify = require('gulp-notify'), //相当于console.log()
	header = require('gulp-header'), //
	filter = require('gulp-filter'), //过滤筛选指定文件
	jshint = require('gulp-jshint'), //js语法校验
	rev = require('gulp-rev-append'), //插入文件指纹（MD5）
	cssnano = require('gulp-cssnano'), //css压缩
	imagemin = require('gulp-imagemin'), //图片优化
	browserSync = require('browser-sync'), //保存自动刷新
	fileinclude = require('gulp-file-include'), //可以include html文件
	autoprefixer = require('gulp-autoprefixer'); //添加css浏览器前缀
	// sourcemaps = require('gulp-run-sequence'); //顺序

var pkg = require('./package.json'); //版本管理内容

var outputDir = 'dist'; //生成文件的地址

var _path = {
	src:'src',
	scripts:'src/scripts',
	css:'src/scripts/css/**/*.css',
	images:'src/scripts/images/**/*.{jpg,jpeg,png,gif}',
	scss:'src/scripts/scss/**/*.scss',
	fonts:'src/scripts/fonts/*',
	js:'src/scripts/js/**/*.js'
	// view:'view'
};
var _bulidPath = {
	dist:'dist',
	scripts:'dist/scripts',
	css:'dist/scripts/css',
	images:'dist/scripts/images',
	fonts:'dist/scripts/fonts',
	js:'dist/scripts/js',
}

// css （拷贝 *.min.css，常规 CSS 则输出压缩与未压缩两个版本）
gulp.task('sass',function() {
	return gulp.src(_path.scss) //传入sass目录及子目录下的所有.scss文件流通过管道
		.pipe(sass({outpuStyle: 'expended'})) //编译 sass 并设置输出格式
		.pipe(autoprefixer('last 5 version')) //添加 CSS 浏览器前缀，兼容最新的5个版本
		.pipe(gulp.dest(_bulidPath.css)) //把管道里的所有文件输出到 dist/css 目录
		.pipe(rename({suffix:'.min'}))
		.pipe(cssnano())
		.pipe(gulp.dest(_bulidPath.css))
});

gulp.task('sass:watch',function(){
	gulp.watch(_path.scss, ['sass']);
})

// css （拷贝 *.min.css，常规 CSS 则输出压缩与未压缩两个版本）
gulp.task('css', function() {
  	return gulp.src(_path.css)
    	.pipe(gulp.dest(_bulidPath.css)) // 把管道里的所有文件输出到 dist/css 目录
    	// .pipe(filter(['*', '!*.min.css'])) // 筛选出管道中的非 *.min.css 文件
    	// .pipe(autoprefixer('last 5 version'))
    	// .pipe(gulp.dest('_bulidPath.css')) // 把处理过的 css 输出到 dist/css 目录
    	// .pipe(rename({suffix: '.min'}))
    	// .pipe(cssnano())
    	// .pipe(rev())
    	// .pipe(gulp.dest('dist/css'))
});
gulp.task('css:watch',function(){
	gulp.watch(_path.css, ['css']);
})


// styleReload （结合 watch 任务，无刷新CSS注入）
gulp.task('styleReload', ['sass', 'css'], function() {
  return gulp.src(_bulidPath.css)
    .pipe(cached('style'))
    .pipe(browserSync.reload({stream: true})); // 使用无刷新 browserSync 注入 CSS
});


// 拷贝文字文件
gulp.task('font',function() {
	return gulp.src(_path.fonts)
		.pipe(gulp.dest(_bulidPath.fonts))
});


// script （拷贝 *.min.js，常规 js 则输出压缩与未压缩两个版本）
gulp.task('script',function() {
	return gulp.src(['src/scripts/**/*.js','!src/scripts/**/*.min.js'])
		.pipe(cached('script'))
		// .pipe(gulp.dest('dist/js'))
		// .pipe(filter(['src/js/*', '!src/js/**/*.min.js'], {restore: true})) // 筛选出管道中的非 *.min.js 文件
	    .pipe(rename({suffix: '.min'}))
	    // .pipe(uglify())
	    // .pipe(rev())
	    .pipe(gulp.dest(_bulidPath.js))
});

// scriptMin （拷贝 *.min.js）
gulp.task('scriptMin',function() {
	return gulp.src(['src/scripts/**/*.min.js'])
		// .pipe(rev())
		.pipe(gulp.dest(_bulidPath.js))
});
//image
gulp.task('image',function() {
	return gulp.src(_path.images)
		.pipe(cached('image'))
		.pipe(imagemin({optimizationLevel: 3, progressive: true, interlaced: true, multipass: true})) // 取值范围：0-7（优化等级）,是否无损压缩jpg图片，是否隔行扫描gif进行渲染，是否多次优化svg直到完全优化
		.pipe(gulp.dest(_bulidPath.images))
});

// html 编译 html 文件
gulp.task('html',function() {
	return gulp.src('src/*.html')
		.pipe(fileinclude())
		.pipe(rev()) //生成并插入MD5
		.pipe(gulp.dest('dist/'))
});

// clean 清空 dist 目录
gulp.task('clean', function() {
 	return del(_bulidPath.dist);
});

// build 需要插入资源指纹（MD5），html 最后执行
gulp.task('build', ['sass', 'css', 'script', 'scriptMin','image','font'], function () {
 	gulp.start('html');
});

// default 默认任务，依赖清空任务
gulp.task('default', ['clean'], function() {
	gulp.start('build');
});

// watch 开启本地服务器并监听
gulp.task('watch',['sass:watch','css:watch'] function() {
 	browserSync.init({
	    server: {
	      baseDir: 'dist' // 在 dist 目录下启动本地服务器环境，自动启动默认浏览器
	    },
	    port:8078 //端口修改（如本地端口被占用，请自行修改此端口）
	});

	// 监控 SASS 文件，有变动则执行CSS注入
	// gulp.watch('src/sass/**/*.scss', ['styleReload']);
 //  	// 监控 CSS 文件，有变动则执行CSS注入
 //  	gulp.watch('src/css/**/*.css', ['styleReload']);
 //  	// 监控 js 文件，有变动则执行 script 任务
 //  	gulp.watch('src/js/**/*.js', ['script']);
 //  	// 监控图片文件，有变动则执行 image 任务
 //  	gulp.watch('src/img/**/*', ['image']);
 //  	// 监控 html 文件，有变动则执行 html 任务
 //  	gulp.watch('src/**/*.html', ['html']);
 //  	// 监控 dist 目录下除 css 目录以外的变动（如js，图片等），则自动刷新页面
 //  	gulp.watch(['dist/**/*', '!dist/css/**/*']).on('change', browserSync.reload);

});