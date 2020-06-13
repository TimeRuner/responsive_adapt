let source_folder = 'src';
let project_folder = 'dist';

let fs = require('fs');

//! об'єкт із шляхами до разних файлів
let path = {
    build: {
        html: project_folder + '/',
        css: project_folder + '/css/',
        js: project_folder + '/js/',
        img: project_folder + '/img/',
        fonts: project_folder + '/fonts/',
    },
    src: {
        html: [source_folder + '/*.html', '!' + source_folder + '/_*.html'], //**читаємо всі html файли, але не копіюємо ! _name.html файли в dist  */
        css: source_folder + '/scss/style.scss', //! для компіляції лише цього файлу, який міститиме інші файли стилів
        js: source_folder + '/js/script.js',
        img: source_folder + '/img/**/*.{png,jpg,svg,gif,ico,webp}', //! ми слухаємо всі підпапки в img з вказаним списком розширинь
        fonts: source_folder + '/fonts/*.{ttf,woff,woff2,eot}',
    },
    //! об'єкт із шляхами до файлів, зміни в яких необхідно постійно моніторити
    watch: {
        html: source_folder + '/**/*.html', //! моніторимо всі файли html
        css: source_folder + '/scss/**/*.scss',
        js: source_folder + '/js/**/*.js',
        img: source_folder + '/img/**/*.{png,jpg,svg,gif,ico,webp}',
    },
    //! об'єкт для видалення папки при кожному запуску gulp
    clean: './' + project_folder + '/'
}

//***підключення плагінів для роботи з ними через змінні */
let { src, dest } = require('gulp'),
gulp = require('gulp'),
browsersync = require('browser-sync').create(),
fileinclude = require('gulp-file-include'),
del = require('del'),
scss = require('gulp-sass'),
autoprefixer = require('gulp-autoprefixer'),
group_media = require('gulp-group-css-media-queries'),
clean_css = require('gulp-clean-css'),
rename = require('gulp-rename'),
uglify = require('gulp-uglify'),
imagemin = require('gulp-imagemin'),
webp = require('gulp-webp'),
webphtml = require('gulp-webp-html'),
webpcss = require('gulp-webpcss'),
// svgSprite = require('gulp-svg-sprite'),
htmlmin = require('gulp-htmlmin'),
cache = require('gulp-cache')







//! функція оновлення браузера
function browserSync(params) {
    browsersync.init({
        server: {
            baseDir: './' + project_folder + '/' //! базова серверна папка
        },
        port: 3000,
        notify: false //! скасовує табличку з написом при активації цієї функції (необов'язковий параметр)
    });
}

//**Метод для оновлення браузера при зміні html і компіляцції багатьох html файлів в один */
function html() {

    return   gulp.src(path.src.html) //***шлях до корінної папки */
        .pipe(webphtml()) //**метод для полегшення піключення webp картинок в документ(не обов'якова без використання webp) */
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(dest(path.build.html)) //*** перемістили файли із папки src в dist*/ 
        .pipe(browsersync.reload({stream: true}));
}
//**метод для обробки css файлів */
function css() {
    return src(path.src.css)
        .pipe( //! задаємо налаштування scss файлу перед відправкою до сервера
            scss({
                outputStyle: 'expanded' //! тип зжимання файлу
            }).on('error', scss.logError)
        )
        .pipe(
            group_media() //! групує запити із різних файлів стилів в один (оптимізація)
        )
        .pipe(
            autoprefixer({ //! задає підтримку коду вказаною межею варесій усіх браузерів
                
                overrideBrowserslist: ['last 5 versions', '>1%', 'ie 8', 'ie 7'],
                cascade: true
            }))
        .pipe(webpcss()) //**метод для компіляції картинок в форматі webp в css коді без спец конструкцій */
        .pipe(dest(path.build.css)) //**Спершу вигружаємо не зжатий файл */
        .pipe(clean_css())
        .pipe(
            rename({
                extname: '.min.css'
            })
        )
        .pipe(dest(path.build.css)) //**вигружаємо зжатий файл */
        .pipe(browsersync.reload({stream: true}));
}

//**метод для збору і налаштування багатьох js файлів в один */
function js() {
    return src(path.src.js)
        .pipe(fileinclude())
        .pipe(dest(path.build.js))
        .pipe(uglify())
        .pipe(
            rename({
                extname: '.min.js'
            })
        )
        .pipe(dest(path.build.js))
        .pipe(browsersync.reload({stream: true}));
}


//**Метод для створення icons */
function images() {
    return src(path.src.img)
        .pipe( //!робота із картинками в форматі webp
            webp({
                quality: 70,
                method: 3,
                autoFilter: true,
                lossless: true
            })
        )
        .pipe(dest(path.build.img)) //!вигрузка фото в форматі webp
        .pipe(src(path.src.img)) //! картинку не перейменувати в min, тому треба прописати ще раз дану команду, що працював код нижче
        .pipe(cache(imagemin({
                progressive: true,
                svgoPlugins: [{
                    removeViewBox: false
                }],
                interlaced: true,
                optimizationLevel: 3
            })))
        .pipe(dest(path.build.img))
        .pipe(browsersync.reload({stream: true}))
}
//**Чиска кешу */
gulp.task('clear', function(){
    return cache.clearAll();
});
//**задача, яку ми викликатимесо окремо в терміналі при потребі використання спрайтів */
// gulp.task('svgSprite', function () {
//     return gulp.src([source_folder + '/iconsprite/*.svg']) //**шлях до спрайтів */
//         .pipe(svgSprite({
//             mode: {
//                 stack: {
//                     sprite: '../icons/icons.svg', //! назва збірки спрайтів, яка буде поміщена на серверну папку img в такій ієрархії
//                 }
//             },
//         }))
//         .pipe(dest(path.build.img));
// });
//**метод webp img */


//**метод для обробки і компіляції шрифтів */
function fonts(params) {
    return gulp.src(path.src.fonts)
    .pipe(dest(path.build.fonts));
}

//**метод для підключення шрифтів в файл стилів працює з медіа файлом підключеним в основному файлі стилів*/

function fontsStyle(params) {
    let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
    if (file_content == '') {
        fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (let i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}

function cb() {

}
//**Метод для відстеження змін в файлах в реальному часі */
function watchFile() {
    gulp.watch(path.watch.html, html); //**метод для відстежування змін в еальному часі(беремо файли для стеження, використовуємо функцію для обробки цих файлів)*/
    gulp.watch(path.watch.css, css);
    gulp.watch(path.watch.js, js);
    gulp.watch(path.watch.img, images);
};

//**Метод для видалення dist на випадок створення непотрібної чи зайвої папки в dist */
function clean(params) {
    return del(path.clean);
}
//! змушую gulp виконувати цю функцію
let build = gulp.series(clean, gulp.parallel(html, css, images, fonts), js, fontsStyle); //! задачі працюють по черзі, послідовно
let watch = gulp.parallel(build, watchFile, browserSync); //! задачі працюють паралельно



//*** */ змушую gulp подружитись із змінними(кожна нова змінна повинна сюди вписуватись для оптимізованішої роботи)

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
//! метод gulp.parallel() виконується не лише при використанні змінної, а й по дефолту
exports.default = watch;