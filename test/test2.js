var turndownPluginGfm = turndownPluginGfm
var gfm = turndownPluginGfm.gfm

var turndownService = new TurndownService({codeBlockStyle : "indented"});
turndownService.use(gfm)

var tmpclean=getSelectionAsCleanHtml();
var selection_markdown = turndownService.turndown(
        tmpclean
      );
console.log(selection_markdown)
var encodetmp=encodeURIComponent(selection_markdown)
console.log(encodetmp)
