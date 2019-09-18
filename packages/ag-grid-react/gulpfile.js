const gulp = require('gulp');
const {series} = require('gulp');
const gulpTypescript = require('gulp-typescript');
const header = require('gulp-header');
const merge = require('gulp-merge');
const pkg = require('./package.json');
const tsConfig = 'tsconfig.build.json';
const typescript = require('rollup-plugin-typescript');
const commonjs = require('rollup-plugin-commonjs');
const uglify = require('rollup-plugin-uglify').uglify;
const rollup = require('rollup-stream');
const source = require('vinyl-source-stream');

const headerTemplate = '// <%= pkg.name %> v<%= pkg.version %>\n';

async function tscTask() {
    const tscProject = gulpTypescript.createProject(tsConfig);
    const tsResult = await gulp.src(
        [
            'src/**/*.ts',
            '!src/**/__tests__/**/*',
            '!src/**/setupTests.ts'
        ]
    ).pipe(tscProject());

    return merge([
        tsResult.dts.pipe(header(headerTemplate, {pkg: pkg})).pipe(gulp.dest('lib')),
        tsResult.js.pipe(header(headerTemplate, {pkg: pkg})).pipe(gulp.dest('lib'))
    ]);
}

const umd = () => {
    return rollup({
        input: './src/main.ts',
        rollup: require('rollup'),
        output: {
            name: 'AgGridReact',
            file: 'my-file.umd.js',
            format: 'umd',
            globals: {
                react: 'React',
                'react-dom': 'ReactDOM',
                'prop-types': 'PropTypes',
                'ag-grid-community': 'agGrid'
            },
        },
        plugins: [typescript(), commonjs(),
            uglify()
        ]
    })
        .pipe(source('ag-grid-react.min.js'))
        .pipe(gulp.dest('./umd'))
};

const watch = () => {
    gulp.watch([
            './src/*',
            './node_modules/ag-grid-community/dist/lib/**/*'],
        tscTask);
};

gulp.task('umd', umd);
gulp.task('commonjs', tscTask);
gulp.task('watch', series('commonjs', watch));
gulp.task('default', series('commonjs', "umd"));
