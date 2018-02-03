
const { readFile , writeFile , waitForFiles }            = require('./modules/filesystem.js')
const { createDirectory , copy , remove }                = require('./modules/fsextra.js')
const { resolvePath }                                    = require('./modules/path.js')
const { asyncAwaitTranspile }                            = require('./modules/transpile.js')
const { listFilesFoldersToCopy , listFilesToTranspile }  = require('./modules/readfolder.js')

const pluginOutputPath = resolvePath(__dirname , '..','..', '__build__')


class ServerlessPlugin
{

  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.originalServicePath = this.serverless.config.servicePath;
    
    var pluginOutputPath      = resolvePath( __dirname ,'..' , '..' , '__build__/' )
    remove(pluginOutputPath)

    this.commands = {
      "async-await": {
        usage: 'Transpile async await code to Node 0.12 and higher',
        options: {
          message: {
            usage:
              ''
          },
        },
      },
    };

    this.hooks = {
      'before:package:initialize': this.prepareServicePath.bind(this),
      'before:package:createDeploymentArtifacts' : this.transpileProject.bind(this),
      'before:deploy:deploy' : this.cleanup.bind(this),
      'before:deploy:function:initialize': this.prepareServicePath.bind(this),
      'before:deploy:function:packageFunction': this.transpileProject.bind(this),
      'after:deploy:function:packageFunction': this.revertServicePath.bind(this),
      'before:deploy:function:deploy': this.cleanup.bind(this),
    };
  }


  prepareServicePath() {
    this.serverless.config.servicePath = pluginOutputPath
  }


  revertServicePath() {
      this.serverless.config.servicePath = this.originalServicePath;
  }


  transpileProject()
  {

    var projectPath        = resolvePath(__dirname , '..' , '..')

    var filesToTranspile     = []
    var filesFolderToCopy    = []

    var code                 = ''
    var sourceCodePath       = ''

    var transpiledCode       = ''
    var transpiledFilePath   = ''

    var fileFolderSourcePath  = ''
    var sourceFileFoldersPath = ''
    var fileFolderCopyPath    = ''

    this.serverless.cli.log('Transpiling Async Await...')

    createDirectory(pluginOutputPath)


    filesToTranspile  =  listFilesToTranspile( projectPath , [] )
    filesFolderToCopy =  listFilesFoldersToCopy(projectPath , [] )


    for(var fileFolder of filesFolderToCopy )
    {


      sourceFileFoldersPath = resolvePath(projectPath , fileFolder)
      fileFolderCopyPath    = resolvePath(pluginOutputPath , fileFolder)

      copy( sourceFileFoldersPath , fileFolderCopyPath )
    }



    for(var file of filesToTranspile)
    {

        sourceCodePath     = resolvePath(projectPath , file)
        transpiledFilePath = resolvePath(pluginOutputPath , file)

        code               = readFile(sourceCodePath , "UTF-8")
        transpiledCode     = asyncAwaitTranspile(code)

        writeFile( transpiledFilePath , transpiledCode)
    }

  }


  cleanup()
  {

    var serverlessFolder      = resolvePath( __dirname , '..' , '..' , '.serverless/')
    var serverlessBuildFolder = resolvePath( __dirname ,'..' , '..' , '__build__' , '.serverless')

    copy(serverlessBuildFolder , serverlessFolder)

  }

}

module.exports = ServerlessPlugin;
