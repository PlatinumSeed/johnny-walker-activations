module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    //CSS
    css_src_path: "css",
    css_build_path: "css",

    // Grunt Tasks
    watch: {
        css: {
            files: [
                        '<%= css_src_path %>/*.scss',
                        '<%= css_src_path %>/libs/*.scss'
                   ],
            tasks: ['default']
        }
    },
    compass: {
        dist: {
            options: {
                config: 'config.rb'
            }
        }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-compass');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task.
  grunt.registerTask('default', ['compass']);
};