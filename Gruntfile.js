/* jshint node:true */

var browsers = [
  { platform: "Windows 8.1", browserName: "firefox", },
  { platform: "Windows 8.1", browserName: "chrome", },
  { platform: "Windows 8.1", browserName: "internet explorer", version: "11" },
  { platform: "Windows 8",   browserName: "internet explorer", version: "10" },
  { platform: "Windows 7",   browserName: "firefox" },
  { platform: "Windows 7",   browserName: "chrome" },
  { platform: "Windows 7",   browserName: "internet explorer", version: "11" },
  { platform: "Windows 7",   browserName: "internet explorer", version: "10" },
  { platform: "Windows 7",   browserName: "internet explorer", version: "9" },
  { platform: "Windows 7",   browserName: "internet explorer", version: "8" },
  { platform: "Windows XP",  browserName: "firefox",  },
  { platform: "Windows XP",  browserName: "chrome",  },
  { platform: "Windows XP",  browserName: "internet explorer", version: "8" },
  { platform: "OS X 10.9",   browserName: "safari", version: "7" },
  { platform: "OS X 10.9",   browserName: "firefox", },
  { platform: "OS X 10.9",   browserName: "chrome",  },
  { platform: "Linux",   browserName: "firefox", },
  { platform: "Linux",   browserName: "chrome",  },
  // { browserName: "safari", platform: "OS X 10.8", version: "6" },
];


var popularBrowsers = [
  // { browserName: "firefox", version: "32", platform: "Windows XP" },
  { browserName: "internet explorer", platform: "Windows 7", version: "11" },
  { browserName: "internet explorer", platform: "Windows 7", version: "10" },
  { browserName: "chrome", platform: "Windows 7" },
  { browserName: "firefox", platform: "Windows 7" },
  { browserName: "safari", platform: "OS X 10.9", version: "7" },
];

const DEV_HOST = 'http://127.0.0.1';
const TEST_PATH = '/tests';

var testUrls = [
  '/index.html',
].map(function(url) { return DEV_HOST + TEST_PATH + url; });


var JS_COPYRIGHT_HEADER = "" +
  "/*!\n" +
  "* Micro AMD Javascript Library v<%= bower.version %>\n" +
  "* https://github.com/seamus-oconnor/micro-amd/\n" +
  "*\n" +
  "* Copyright 2014 - <%= grunt.template.today('yyyy') %> Pneumatic Web Technologies Corp. and other contributors\n" +
  "* Released under the MIT license\n" +
  "* https://github.com/seamus-oconnor/micro-amd/tree/LICENSE.md\n" +
  "*/\n\n\n";


var gruntConfig = {
  jshint: {
    source: {
      options: {
        jshintrc: true,
      },
      files: {
        src: ['src/micro-amd.js', 'Gruntfile.js', 'tests/**/*.js']
      },
    }
  },
  clean: ['dist/'],
  mkdir: {
    build: {
      options: {
        create: ['dist/']
      },
    },
  },
  copy: {
    microamd: {
      src: 'src/micro-amd.js',
      dest: 'dist/micro-amd.js',
    },
  },
  uglify: {
    dist: {
      options: {
        ASCIIOnly: true,
        mangle: false,
        width: 80,
        beautify: {
          beautify: true,
          indent_level: 2,
        },
        preserveComments: false,
        banner: JS_COPYRIGHT_HEADER
      },
      files: [
        { src: ['dist/micro-amd.js'], dest: 'dist/micro-amd.js' },
      ]
    },
    minify: {
      options: {
        ASCIIOnly: true,
        mangle: true,
        preserveComments: false,
        banner: JS_COPYRIGHT_HEADER
      },
      files: [
        { src: ['dist/micro-amd.js'], dest: 'dist/micro-amd.min.js' },
      ]
    },
  },
  removelogging: {
    microamd: {
      src: 'dist/micro-amd.js',
    }
  },
  mocha: {
    options: {
      log: true,
      logErrors: true,
      run: false,
    },
    test: {
      options: {
        urls: testUrls
      }
    }
  },
  connect: {
    server: {
      options: {
        base: '',
        port: 80,
      }
    }
  },
  watch: {
    scripts: {
      files: ['src/**/*.js', 'tests/specs/**/*.js', 'tests/*.html'],
      tasks: [
        'jshint',
        '_mochaTests',
      ],
    },
  },
  'saucelabs-mocha': {
    oneoff: {
      options: {
        urls: [ DEV_HOST + TEST_PATH + '/index.html' ],
        tunnelTimeout: 5,
        browsers: [ { platform: "Windows XP", browserName: "internet explorer", version: "8" } ],
        testname: 'one off test',
      }
    },
    browsers: {
      options: {
        urls: [ DEV_HOST + TEST_PATH + '/index.html' ],
        tunnelTimeout: 5,
        build: '<%= grunt.template.today("isoDateTime") %>',
        browsers: popularBrowsers,
        testname: 'popular browsers',
        maxRetries: 2,
        tags: ["master"]
      }
    },
    release: {
      options: {
        urls: [ DEV_HOST + TEST_PATH + '/index.html' ],
        tunnelTimeout: 5,
        build: '<%= grunt.template.today("isoDateTime") %>',
        browsers: browsers,
        testname: 'release candiate: <%= releaseVer %>',
        maxRetries: 2,
        // tags: ["master"]
      }
    },
  },
  bump: {
    options: {
      files: ['bower.json', 'package.json'],
      updateConfigs: ['bower'],
      commitFiles: ['-a'],
      pushTo: 'origin',
      push: false,
    }
  },
};

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-mocha');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-remove-logging');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.loadNpmTasks('grunt-saucelabs');
  grunt.loadNpmTasks('grunt-bump');

  gruntConfig.bower = grunt.file.readJSON('bower.json');
  gruntConfig.releaseVer = gruntConfig.bower.version + '-RC';

  grunt.initConfig(gruntConfig);

  grunt.registerTask('_mochaTests', [
    'mocha',
  ]);

  grunt.registerTask('build', [
    'jshint',
    'clean',
    'mkdir',
    'copy',
    'removelogging',
    'uglify:minify',
    'uglify:dist',
  ]);

  grunt.registerTask('test', [
    'build',
    'connect',
    '_mochaTests',
  ]);

  grunt.registerTask('test:oneoff', [
    'test',
    'saucelabs-mocha:oneoff',
  ]);

  grunt.registerTask('test:browsers', [
    'test',
    'saucelabs-mocha:browsers',
  ]);

  grunt.registerTask('test:release', [
    'test',
    'saucelabs-mocha:release',
  ]);

  grunt.registerTask('dev', [
    'build',
    'connect',
    'watch'
  ]);

  grunt.registerTask('release', 'Build a release and push to Github', function(n) {
    if(!n) {
      n = 'patch';
    }
    grunt.task.run('bump-only:' + n, 'build', 'bump-commit');
  });
};
