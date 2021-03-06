var gulp = require('gulp');
var watch = require('gulp-watch');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var cleanCSS = require('gulp-clean-css');
var imagemin = require('gulp-imagemin');
var rename = require('gulp-rename');
var del = require('del');
var notify = require('gulp-notify');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var wiredep = require('gulp-wiredep');
var useref = require('gulp-useref');
var gulpif = require('gulp-if');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var run = require('run-sequence');
var rigger = require('gulp-rigger');


var path = {
    build: {
        html: 'build/',
        html_pages: 'build/pages/',
        js: 'build/js/',
        css: 'build/css/',
        img: 'build/img/',
        fonts: 'build/fonts/'
    },
    src: {
        html: 'src/*.html',
        js: 'src/js/*.js',
        style: 'src/style/style.scss',
        img: 'src/img/**/*.*',
        fonts: 'src/fonts/**/*.*'
    },
    watch: {
        html: 'src/**/*.html',
        js: 'src/js/**/*.js',
        style: 'src/style/**/*.scss',
        img: 'src/img/**/*.*',
        fonts: 'src/fonts/**/*.*'
    },
    clean: './build'
};

gulp.task('default', ['clean'], function() {
    gulp.start('dev');
});

gulp.task('production', ['clean'], function() {
    gulp.start('build');
});

// Сборка в режиме разработки
gulp.task('dev', function(cb) {
    run('build',
    'watch',
    'browser-sync',
    cb);
});

// Сборка в режиме prodaction
gulp.task('build', function(cb) {
    run('html:build',
        'style:build',
        'js:build',
        'fonts:build',
        'image:build',
        cb);
});

// Слежка за изменениями
gulp.task('watch', function(){
    watch([path.watch.html], function(event, cb) {
        gulp.start('html:build');
    });
    watch([path.watch.style], function(event, cb) {
        gulp.start('style:build');
    });
    watch([path.watch.js], function(event, cb) {
        gulp.start('js:build');
    });
    watch([path.watch.img], function(event, cb) {
        gulp.start('image:build');
    });
    watch([path.watch.fonts], function(event, cb) {
        gulp.start('fonts:build');
    });
});

gulp.task('style:build', function() {
    gulp.src(path.src.style)
        .pipe(plumber({ // Ловля ошибок
            errorHandler: notify.onError(function(err) { // Представление ошибок в удобочитаемом виде (notify)
                return {
                    title: 'Styles',
                    message: err.message
                };
            })
        }))
        .pipe(sourcemaps.init()) // История изменения стилей (для наглядности в devTools)
        .pipe(sass()) // Компиляция sass
        .pipe(autoprefixer({ // Добавление autoprefixer
            browsers: ['last 2 versions']
        }))
        .pipe(cleanCSS()) // Минификация стилей
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.build.css))
        .pipe(reload({stream: true}));
});

gulp.task('html:build', function() {
    gulp.src(path.src.html)
        .pipe(rigger()) // Объединение кусков html в один index.html
        .pipe(wiredep({ // Добавление ссылок на плагины bower
            directory: 'bower_components/'
        }))
        .pipe(gulp.dest(path.build.html))
        .on('end', function() {
            gulp.start('html:copy');
        })
        .on('end', function() {
            gulp.start('useref')
        })
        .pipe(reload({stream: true}));
});

gulp.task('html:copy', function() {
    return gulp.src('src/pages/*.html')
        .pipe(rigger())
        .pipe(wiredep({ // Добавление ссылок на плагины bower
            directory: 'bower_components/'
        }))
        .pipe(gulp.dest(path.build.html_pages))
        .on('end', function() {
            gulp.start('useref_pages')
        })
});

gulp.task('js:build', function() {
    gulp.src(path.src.js)
        .pipe(uglify()) // Минификация скриптов.
        .pipe(gulp.dest(path.build.js))
        .pipe(reload({stream: true}));
});


gulp.task('image:build', function() {
    gulp.src(path.src.img)
        .pipe(imagemin([
            imagemin.optipng({optimizationLevel: 3}),
            imagemin.jpegtran({progressive: true})
        ]))
        .pipe(gulp.dest(path.build.img))
        .pipe(reload({stream: true}));
});

gulp.task('fonts:build', function() {
    gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts))
        .pipe(reload({stream: true}));
});

gulp.task('useref', function() {
    return gulp.src('build/index.html')
        .pipe(useref()) // Выполняет объединение файлов в один по указанным в разметке html комментариями
        .pipe(gulp.dest(path.build.html));
});

gulp.task('useref_pages', function() {
    return gulp.src('build/pages/*.html')
        .pipe(useref()) // Выполняет объединение файлов в один по указанным в разметке html комментариями
        .pipe(gulp.dest(path.build.html_pages));
});

gulp.task('clean', function() {
    return del(path.clean);
});

// Запуска live-сервера
gulp.task('browser-sync', function() {
    return browserSync.init({
        server: {
            baseDir: './build/'
        }
    });
});
