module.exports = function(grunt) {
  grunt.initConfig({
    zip_directories:{
      lib: {
        filter: 'isDirectory',
        expand: true,
        cwd: './public/lib',
        src: ['*'],
        dest: './public'
      }
    }
  });

  grunt.loadNpmTasks('grunt-zip-directories');

  grunt.registerTask('pack', ['zip_directories']);
}
