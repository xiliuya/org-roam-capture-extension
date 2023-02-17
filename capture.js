///////////////////////////////////////////////////////////////////////////////////
// Copyright (c) 2015-2017 Konstantin Kliakhandler				 //
// 										 //
// Permission is hereby granted, free of charge, to any person obtaining a copy	 //
// of this software and associated documentation files (the "Software"), to deal //
// in the Software without restriction, including without limitation the rights	 //
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell	 //
// copies of the Software, and to permit persons to whom the Software is	 //
// furnished to do so, subject to the following conditions:			 //
// 										 //
// The above copyright notice and this permission notice shall be included in	 //
// all copies or substantial portions of the Software.				 //
// 										 //
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR	 //
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,	 //
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE	 //
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER	 //
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, //
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN	 //
// THE SOFTWARE.								 //
///////////////////////////////////////////////////////////////////////////////////

(function () {
  class Capture {
    createCaptureURI() {
      var protocol = "capture";
      var protocol = this.protocol;

      if (protocol == "roam-ref")
        return (
          "org-protocol://" +
          protocol +
          "?template=" +
          "r" +
          "&ref=" +
          this.encoded_url +
          "&title=" +
          this.escaped_title +
          "&body=" +
          this.selection_markdown
          //this.selection_html
        );

      var template =
        this.selection_text != ""
          ? this.selectedTemplate
          : this.unselectedTemplate;
      if (this.useNewStyleLinks)
        return (
          "org-protocol://" +
          protocol +
          "?template=" +
          template +
          "&url=" +
          this.encoded_url +
          "&title=" +
          this.escaped_title +
          "&body=" +
          this.selection_text
        );
      else
        return (
          "org-protocol://" +
          protocol +
          ":/" +
          template +
          "/" +
          this.encoded_url +
          "/" +
          this.escaped_title +
          "/" +
          this.selection_text
        );
    }

    constructor() {
      this.window = window;
      this.document = document;
      this.location = location;
      var docFragment = window.getSelection().getRangeAt(0).cloneContents();
      var tempDiv = document.createElement("div");
      tempDiv.appendChild(docFragment);

      this.selection_html = tempDiv.innerHTML;
      var tmpclean=getSelectionAsCleanHtml();
      this.selection_markdown = turndownService.turndown(
        "<h1>Hello world!</h1>"
      );
      this.selection_markdown = turndownService.turndown(
        tmpclean
      );
      console.log(this.selection_markdown);

      this.selection_text = escapeIt(window.getSelection().toString());
      this.encoded_url = encodeURIComponent(location.href);
      this.escaped_title = escapeIt(document.title);
    }

    capture() {
      var uri = this.createCaptureURI();

      if (this.debug) {
        logURI(uri);
      }

      location.href = uri;

      if (this.overlay) {
        toggleOverlay();
      }
    }

    captureIt(options) {
      if (chrome.runtime.lastError) {
        alert(
          "Could not capture url. Error loading options: " +
            chrome.runtime.lastError.message
        );
        return;
      }

      if (this.selection_text) {
        this.template = this.selectedTemplate;
        this.protocol = this.selectedProtocol;
      } else {
        this.template = this.unselectedTemplate;
        this.protocol = this.unselectedProtocol;
      }

      for (var k in options) this[k] = options[k];
      this.protocol = options.selectedProtocol;
      this.capture();
    }
  }

  function replace_all(str, find, replace) {
    return str.replace(new RegExp(find, "g"), replace);
  }

  function escapeIt(text) {
    return replace_all(
      replace_all(
        replace_all(encodeURIComponent(text), "[(]", escape("(")),
        "[)]",
        escape(")")
      ),
      "[']",
      escape("'")
    );
  }

  function logURI(uri) {
    window.console.log(
      "Capturing the following URI with new org-protocol: ",
      uri
    );
    return uri;
  }

  function toggleOverlay() {
    var outer_id = "org-capture-extension-overlay";
    var inner_id = "org-capture-extension-text";
    if (!document.getElementById(outer_id)) {
      var outer_div = document.createElement("div");
      outer_div.id = outer_id;

      var inner_div = document.createElement("div");
      inner_div.id = inner_id;
      inner_div.innerHTML = "Captured";

      outer_div.appendChild(inner_div);
      document.body.appendChild(outer_div);

      var css = document.createElement("style");
      css.type = "text/css";
      // noinspection JSAnnotator
      css.innerHTML = `#org-capture-extension-overlay {
        position: fixed; /* Sit on top of the page content */
        display: none; /* Hidden by default */
        width: 100%; /* Full width (cover the whole page) */
        height: 100%; /* Full height (cover the whole page) */
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0,0,0,0.2); /* Black background with opacity */
        z-index: 1; /* Specify a stack order in case you're using a different order for other elements */
        cursor: pointer; /* Add a pointer on hover */
    }

    #org-capture-extension-text{
    position: absolute;
    top: 50%;
    left: 50%;
    font-size: 50px;
    color: white;
    transform: translate(-50%,-50%);
    -ms-transform: translate(-50%,-50%);
}`;
      document.body.appendChild(css);
    }

    function on() {
      document.getElementById(outer_id).style.display = "block";
    }

    function off() {
      document.getElementById(outer_id).style.display = "none";
    }

    on();
    setTimeout(off, 200);
  }
  function imgToCanvasToDataUrl(imgEl) {
    return new Promise((resolve) => {
      let img = new Image();
      img.setAttribute("crossorigin", "anonymous"); // TODO: What is this?
      img.onload = function () {
        let canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.drawImage(img, 0, 0);
        imgEl.setAttribute("src", canvas.toDataURL("image/png"));
        resolve(imgEl.src);
      };
    });
  }

  function getSelectionAsCleanHtml() {
    let selection = document.getSelection();
    if (!selection) {
      console.error("[To Developer] document.getSelection() is null???");
      return "ERROR";
    }
    if (selection.rangeCount === 0) {
      let frames = document.getElementsByTagName("iframe");
      if (frames) {
        for (let i = 0; i < frames.length; i++) {
          const frame = frames[i];
          const contentDocument = frame.contentDocument;
          if (!contentDocument) {
            continue;
          }
          const tmpSel = contentDocument.getSelection();
          if (!tmpSel) {
            continue;
          }
          if (tmpSel.rangeCount > 0) {
            selection = tmpSel;
            break; // NOTE: Right?
          }
        }
      }
    }

    if (selection.rangeCount === 0) {
      console.log(
        "[INFO] document.getSelection().rangeCount is 0. Return empty string."
      );
      return "";
    }

    const container = document.createElement("div");

    for (let i = 0; i < selection.rangeCount; ++i) {
      container.appendChild(selection.getRangeAt(i).cloneContents());
    }

    for (let a of container.getElementsByTagName("a")) {
      const href = a.getAttribute("href");
      if (!href) {
        continue;
      }
      if (href.startsWith("http")) {
        continue;
      }
      // const fixedHref = url.resolve(document.URL, href);
      // a.setAttribute("href", fixedHref);
      // url.resolve 已废弃
      const fixedHref = new URL(href,document.URL);
      a.setAttribute("href", fixedHref);
    }

    for (let img of container.getElementsByTagName("img")) {
      const src = img.getAttribute("src");
      if (!src) {
        continue;
      }
      if (src.startsWith("http")) {
        continue;
      }
      if (src.startsWith("data:")) {
        continue;
      }
      // const fixedSrc = url.resolve(document.URL, src);
      // img.setAttribute("src", fixedSrc);
      const fixedSrc = new URL("src",document.URL);
      img.setAttribute("src", fixedSrc);
    }

    // if (options.convertImageAsDataUrl) {
    //   for (let img of container.getElementsByTagName("img")) {
    //     const src = img.getAttribute("src");
    //     if (!src) {
    //       continue;
    //     }
    //     if (!src.startsWith("http")) {
    //       continue;
    //     }
    //     const srcWithoutParam = src.split("?", 2)[0];
    //     if (srcWithoutParam.match(/(gif|jpe?g|png|webp)$/)) {
    //       img.setAttribute("src", imgToCanvasToDataUrl(img));
    //     }
    //   }
    // }

    const cleanHTML = container.innerHTML;
    return cleanHTML;
  }

  var turndownService = new TurndownService();
  //this.selection_markdown = turndownService.turndown('<h1>Hello world!</h1>');
  var capture = new Capture();
  var f = function (options) {
    capture.captureIt(options);
  };
  chrome.storage.sync.get(null, f);
})();
