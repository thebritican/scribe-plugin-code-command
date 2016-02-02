define(function () {

  /**
   * Adds a command for using CODEs.
   */

  'use strict';

  return function () {
    return function (scribe) {
      var codeCommand = new scribe.api.SimpleCommand('code', 'CODE');

      codeCommand.execute = function () {
        scribe.transactionManager.run(function () {
          // TODO: When this command supports all types of ranges we can abstract
          // it and use it for any command that applies inline styles.
          var selection = new scribe.api.Selection();
          var range = selection.range;
          var containingText = selection.getContaining(scribe.node.isText);
          if (containingText && containingText.parentElement.tagName === 'CODE') {
          // if surrounded by code
            if (!range.collapsed) {
              // if it's a selection remove the code it
              var code = containingText.parentElement;
              range.setStartBefore(code);
              range.setEndAfter(code);
              scribe.node.unwrap(containingText.parentElement.parentElement, containingText.parentElement);
              selection.selection.removeAllRanges();
              selection.selection.addRange(range);
              return;
            }
            // otherwise pop out
            var text = containingText.parentElement.parentElement;
            text.innerHTML += '&#x200b;';
            range.selectNode(text);
            range.collapse(false);
            selection.selection.removeAllRanges();
            selection.selection.addRange(range);
            return;
          }

          var selectedHtmlDocumentFragment = range.extractContents();

          var codeElement = document.createElement('code');
          var isEmptySelection = selectedHtmlDocumentFragment.textContent === '';
          if (isEmptySelection) { // toggle code
            codeElement.innerHTML = '&#x200b;';
          } else { // clean out any nested code spans in selection
            var codeElements = selectedHtmlDocumentFragment.querySelectorAll('code');
            if (codeElements) {
              var codeEleArray = Array.from(codeElements);
              codeEleArray.forEach(function (code) {
                scribe.node.unwrap(code.parentNode, code);
              });
            }
            codeElement.appendChild(selectedHtmlDocumentFragment);
          }

          range.insertNode(codeElement);

          range.selectNodeContents(codeElement);

          // Re-apply the range
          selection.selection.removeAllRanges();
          selection.selection.addRange(range);
        });
      };

      // There is no native command for CODE elements, so we have to provide
      // our own `queryState` method.
      // TODO: Find a way to make it explicit what the sequence of commands will
      // be.
      codeCommand.queryState = function () {
        var selection = new scribe.api.Selection();
        return selection.getContaining(function (node) {
          return node.nodeName === this.nodeName;
        }.bind(this));
      };

      // There is no native command for CODE elements, so we have to provide
      // our own `queryEnabled` method.
      // TODO: Find a way to make it explicit what the sequence of commands will
      // be.
      codeCommand.queryEnabled = function () {
        return true;
      };

      scribe.commands.code = codeCommand;
    };
  };
});
