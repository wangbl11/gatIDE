/**
 * Data structure describing a Selenium 1/2 locator. The "values" property maps different ways of
 * locating an element to the values used to do so. (For example, mapping
 * builder.locator.methods.id to "searchField".) The "preferredMethod" property specifies which
 * method should be used.
 */
 
builder.locator = {};

/**
 * Available types of locator, to be used as keys. Use eg builder.locator.methods.xpath to refer to
 * the idea of an xpath locator.
 */
builder.locator.methods = {
  id:         {toString: function() { return "id"; }},
  name:       {toString: function() { return "name"; }},
  link:       {toString: function() { return "link"; }},
  css:        {toString: function() { return "css"; }},
  xpath:      {toString: function() { return "xpath"; }},
  polygon:    {toString: function() { return "polygon"; }},
  descendantText: {toString: function() { return "descendantText"; }},
  uncleText:  {toString: function() { return "uncleText"; }},
  imgText:  {toString: function() { return "imgText"; }},
  xpathAttribute:  {toString: function() { return "xpathAttribute"; }}
};

builder.locator.methods.id[builder.selenium2] = "id";
builder.locator.methods.name[builder.selenium2] = "name";
builder.locator.methods.link[builder.selenium2] = "link text";
builder.locator.methods.css[builder.selenium2] = "css selector";
builder.locator.methods.xpath[builder.selenium2] = "xpath";
builder.locator.methods.polygon[builder.selenium2] = "polygon";
builder.locator.methods.descendantText[builder.selenium2] = "descendantText";
builder.locator.methods.uncleText[builder.selenium2] = "uncleText";
builder.locator.methods.imgText[builder.selenium2] = "imgText";
builder.locator.methods.xpathAttribute[builder.selenium2] = "xpathAttribute";

builder.locator.methodForName = function(seleniumVersion, name) {
  for (var k in builder.locator.methods) {
    if (builder.locator.methods[k][seleniumVersion] === name) {
      return builder.locator.methods[k];
    }
  }
  return null;
};

builder.locator.locateElement = function(window, type, value) {
  return builder.locator['locateElementBy' + builder.locator.capitalize(type.toString())](window, value);
};

builder.locator.locateElementById = function(window, id) {
  return window.document.getElementById(id);
};

builder.locator.locateElementByName = function(window, name) {
  var jq = jQuery("[name='" + name + "']", window.document);
  return jq[0] ? jq[0] : null;
};

builder.locator.locateElementByLink = function(window, linkText) {
  linkText = builder.normalizeWhitespace(linkText.toLowerCase());
  var els = jQuery("a", window.document).get().filter(function(el) {
    return builder.normalizeWhitespace(jQuery(el).text().toLowerCase()) == linkText;
  });
  return els.length > 0 ? els[0] : null;
};

builder.locator.locateElementByCss = function(window, css) {
  var els = cssQuery(css, window.document);
  return els.length > 0 ? els[0] : null;
};

builder.locator.locateElementByXpath = function(window, xpath) {
  if (!window.document.evaluate) {
    install(window);
  }
  // Why 7 as a parameter? No one knows. It's what http://coderepos.org/share/wiki/JavaScript-XPath uses.
  // And there's no docs, only a handful of examples. Sigh. But this *seems* to work. qqDPS
  var el = window.document.evaluate(xpath, window.document, null, 7, null);
  return el.snapshotItem(0) ? el.snapshotItem(0) : null;
};

/**
 * @param The preferred location method (one of builder.locator.methods).
 * @param Map of locator methods to appropriate values.
 */
builder.locator.Locator = function(preferredMethod, preferredAlternative, values) {
  this.preferredMethod = preferredMethod;
  this.preferredAlternative = preferredAlternative || 0;
  this.values = values || {};
  this.__originalElement = null;
};

builder.locator.Locator.prototype = {
  /** @return Name of the locator's preferred location method for the given version. */
  getName: function(selVersion) { return this.preferredMethod[selVersion]; },
  /** @return Value of the preferred method. */
  getValue: function()    {
    if (this.values[this.preferredMethod]) {
      if (this.preferredAlternative >= this.values[this.preferredMethod].length) {
        return "";
      }
      return this.values[this.preferredMethod][this.preferredAlternative] || "";
    } else {
      return "";
    }
  },
  /** @return The same locator with the given preferred method. */
  withPreferredMethod: function(preferredMethod, preferredAlternative) {
    var l2 = new builder.locator.Locator(preferredMethod, preferredAlternative || 0);
    for (var t in this.values) { l2.values[t] = this.values[t].slice(0); }
  },
  /** @return Whether the locator has a value for the given locator method. */
  supportsMethod: function(method) {
    if (this.values[method] && this.values[method].length > 0) { return true; } else { return false; }
  },
  /** @return Get the value for the given method. */
  getValueForMethod: function(method, alternative) {
    alternative = alternative || 0;
    if (this.values[method]) {
      if (alternative >= this.values[method].length) {
        return "";
      }
      return this.values[method][alternative] || "";
    } else {
      return "";
    }
  },
  /** @return Whether the given locator has the same preferred method with the same value. */
  probablyHasSameTarget: function(l2) {
    if (this.__originalElement && l2.__originalElement) {
      return this.__originalElement == l2.__originalElement;
    }
    return this.preferredMethod === l2.preferredMethod && this.getValue() === l2.getValue();
  },
  /** @return all candidates to background script**/
  fullJsonTxt: function(){
  	 var ret=[];
     //default prefered locator
     if (this.getValue().length>0)
       ret.push({
         type: this.getName(builder.selenium2),
         value: this.getValue()
       });
     var _val;
     for(var item in this.values){
     	 if (item==this.preferredMethod) continue;
     	 _val=this.getValueForMethod(item);
     	 if (_val.length>0)
     	 ret.push({
     	 	 type:item,
     	 	 value:_val
     	 });
     }
     //return JSON.stringify(ret);
     return ret;
  }
};

builder.locator.empty = function() {
  return new builder.locator.Locator(builder.locator.methods.id);
};

builder.locator.getNodeNbr = function(current) {
  var childNodes = current.parentNode.childNodes;
  var total = 0;
  var index = -1;
  for (var i = 0; i < childNodes.length; i++) {
    var child = childNodes[i];
    if (child.nodeName == current.nodeName) {
      if (child == current) {
        index = total;
      }
      total++;
    }
  }
  return index;
};
builder.locator.descendantText= function(e,parentNodeName){
	if (e.nodeType == 3) { //text-node
		  var text = e.nodeValue;
		  console.log(text);
          if (!text.match(/^\s*$/)) {
            //return  ((parentNodeName==null)?'*':parentNodeName)+"[contains(text(),'"+text.replace(/^\s+/, '').replace(/\s+$/, '') + "')]";
            //gat3047
            //return  ((parentNodeName==null)?'*':parentNodeName)+"[text()='"+text+ "']";
            //gat-3167 sometime, a node is added dynamically
            //return  "*[text()='"+text+ "']";
            //gat-3323
            var _text=text.replace(/^\s+/, '').replace(/\s+$/, '');
            return  "*[normalize-space(text())='"+_text+ "']";
            
          }        
    }
	var childNodes = e.childNodes;
    for (var i = 0; i < childNodes.length; i++) {
       var ret=builder.locator.descendantText(childNodes[i],e.nodeName.toLowerCase());
       if (ret!=null) return ret;
    }
	return null;
}
builder.locator.ancestorText= function(e){
	var _nodeName=e.nodeName.toLowerCase();
	console.log(_nodeName);
	if (!_nodeName) return null;
	var txt=builder.locator.descendantText(e,null); 
	console.log(txt);
    if (txt!=null) return '//'+_nodeName+'[descendant::'+txt+']';
    
	var myParent = e.parentNode;
    var ret=builder.locator.ancestorText(myParent);
    if (ret!=null) return ret+'/'+_nodeName;
    
	return null;
}

builder.locator.prevHighlightMethod = null;
builder.locator.prevHighlightValue = null;
builder.locator.prevHighlightOriginalStyle = null;

builder.locator.deHighlight = function(callback) {
  if (!builder.locator.prevHighlightMethod) { callback(); return; }
  var win = window;
  var node = builder.locator.locateElement(win, builder.locator.prevHighlightMethod, builder.locator.prevHighlightValue);
  if (node) {
    node.style.border = builder.locator.prevHighlightOriginalStyle;
  }
  builder.locator.prevHighlightMethod = null;
  callback();
};

builder.locator.highlight = function(method, value) {
  sebuilder.focusRecordingTab();
  builder.locator.deHighlight(function() {
    builder.locator.prevHighlightMethod = method;
    builder.locator.prevHighlightValue = value;
    var win = window;
    var node = builder.locator.locateElement(win, method, value);
    if (node) {
      builder.locator.prevHighlightOriginalStyle = node.style.border;
      node.style.border = "2px solid red";
    }
  });
};

builder.locator.getCSSSubPath = function(e) {
  var css_attributes = ['id', 'name', 'class', 'type', 'alt', 'title', 'value'];
  for (var i = 0; i < css_attributes.length; i++) {
    var attr = css_attributes[i];
    var value = e.getAttribute(attr);
    if (value) {
      if (attr == 'id')
        return '#' + value;
      if (attr == 'class')
        return e.nodeName.toLowerCase() + '.' + value.replace(" ", ".").replace("..", ".");
      return e.nodeName.toLowerCase() + '[' + attr + '="' + value + '"]';
    }
  }
  if (builder.locator.getNodeNbr(e)) {
    return e.nodeName.toLowerCase() + ':nth-of-type(' + builder.locator.getNodeNbr(e) + ')';
  } else {
    return e.nodeName.toLowerCase();
  }
};

/**
 * Generates a best-guess locator from an element.
 * @param element The element to create a locator for
 * @param applyTextTransforms Whether to apply CSS text-transforms for link texts, which is what
 *        Webdriver wants but Selenium 1 doesn't.
 * @return A locator
 */
builder.locator.fromElement = function(element, applyTextTransforms) {
  var values = {};
  var preferredMethod = null;

  // FIXME: This function needs a lot more thought, for example the "value" property is much
  // more useful for type="submit".
  // TODO: set locator.frame to be a locator to the frame containing the element
  
  // Locate by ID
  var id = element.getAttribute('id');
  console.log(id);
  if (id) {
  	if (validIDs(id)){
      values[builder.locator.methods.id] = [id];
      values[builder.locator.methods.css] = ["#" + id];
      if (findNode("id", id) === element) {
        preferredMethod = builder.locator.methods.id;
      }
    }
  }
  
  // Locate by name
  var name = element.getAttribute('name');
  console.log(name);
  if (name) {
    values[builder.locator.methods.name] = [name];
    if (!preferredMethod && findNode("name", name) === element) {
      preferredMethod = builder.locator.methods.name;
    }
  }
  
  // Locate by id
  if (id) {
  	if (isDynamicID(id)==false&&notRecordIDs(id)==false){
      values[builder.locator.methods.id] = [id];
      values[builder.locator.methods.css] = ["#" + id];
      if (!preferredMethod &&findNode("id", id) === element) {
        preferredMethod = builder.locator.methods.id;
      }
    }
  }
  // check polygon
  var _found=polygon(element);
  if (_found){
  	  values[builder.locator.methods.polygon] = [_found];
  	  if (!preferredMethod &&findNode("xpath", _found) === element) {
        preferredMethod = builder.locator.methods.polygon;
      }
  }
  // Locate by link text
  if ((element.tagName.toUpperCase() === "A") ||
      (element.parentNode.tagName && element.parentNode.tagName.toUpperCase() === "A")) 
  {
    var el = element.tagName.toUpperCase() === "A" ? element : element.parentNode;
    var link = removeHTMLTags(el.innerHTML);
    console.log(link);
    if (link) {
      values[builder.locator.methods.link] = [applyTextTransforms ? removeHTMLTags(getCorrectCaseText(el)): link];
      console.log(link);
      if (!preferredMethod && findNode("link", link) === el) {
        preferredMethod = builder.locator.methods.link;
      }
    }
  }
  
  //check imgText
  _found=imgText(element);
  console.log(_found);
  if (_found){
  	  values[builder.locator.methods.imgText] = [_found];
  	  if (!preferredMethod &&findNode("xpath", _found) === element) {
        preferredMethod = builder.locator.methods.imgText;
      }
  }

  _found=uncleText(element);
  console.log(_found);
  if (_found){
  	  values[builder.locator.methods.uncleText] = [_found];
  	  if (!preferredMethod &&findNode("xpath", _found) === element) {
        preferredMethod = builder.locator.methods.uncleText;
      }
  }

  _found=descendantText(element);
  console.log(_found);
  if (_found){
  	  values[builder.locator.methods.descendantText] = [_found];
  	  if (!preferredMethod &&findNode("xpath", _found) === element) {
        preferredMethod = builder.locator.methods.descendantText;
      }
  }

  _found=xpathAttribute(element);
  console.log(_found);
  if (_found){
  	  values[builder.locator.methods.xpathAttribute] = [_found];
  	  if (!preferredMethod) {
        preferredMethod = builder.locator.methods.xpathAttribute;
      }
  }

  // Locate by CSS
  var current = element;
  var sub_path = builder.locator.getCSSSubPath(element);
  console.log(sub_path);
  while (findNode("css", sub_path) != element && current.nodeName.toLowerCase() != 'html') {
    sub_path = builder.locator.getCSSSubPath(current.parentNode) + ' > ' + sub_path;
    current = current.parentNode;
  }
  console.log(sub_path);
  if (findNode("css", sub_path) == element) {
    if (values[builder.locator.methods.css]) {
     //added by tina to remove duplicated locators
     var _match=false;
     jQuery.each(values[builder.locator.methods.css],function(idx,val){
      	  if (val===sub_path){
      	  	  _match=true;
      	  	  return;
      	  }
      });
      if (!_match)
        values[builder.locator.methods.css].push(sub_path);
    } else {
      values[builder.locator.methods.css] = [sub_path];
    }
    if (!preferredMethod) {
      preferredMethod = builder.locator.methods.css;
    }
  }
  console.log('xpath');
  // Locate by XPath
  var xpath = getHtmlXPath(element);
  console.log(xpath);
  if (xpath) {
    // Contrary to the XPath spec, Selenium requires the "//" at the start, even for paths that 
    // don't start at the root.
    xpath = (xpath.substring(0, 2) !== "//" ? ("/" + xpath) : xpath);
    values[builder.locator.methods.xpath] = [xpath];
    if (!preferredMethod) {
      preferredMethod = builder.locator.methods.xpath;
    }
  }
  console.log('fullxpath');
  // Locate by XPath
  var fullxpath = getFullXPath(element);
  if (fullxpath && xpath != fullxpath) {
    if (values[builder.locator.methods.xpath]) {
      values[builder.locator.methods.xpath].push(fullxpath);
    } else {
      values[builder.locator.methods.xpath] = [fullxpath];
    }
    if (!preferredMethod) {
      preferredMethod = builder.locator.methods.xpath;
    }
  }
  console.log('class');
  // Locate by class 
  var className = element.getAttribute('class');
  if (className && !values[builder.locator.methods.css]) {
    values[builder.locator.methods.css] = [element.tagName.toLowerCase() + "." + className.replace(/ .*/, '')];
    if (!preferredMethod) {
      preferredMethod = builder.locator.methods.css;
    }
  }
  
  var loc = new builder.locator.Locator(preferredMethod, 0, values);
  loc.__originalElement = element;
  console.log('values');
  return loc;
};

// Helper functions:

/** The DOM type enum of an Element node, as opposed to eg an attribute or text. */
var ELEMENT_NODE_TYPE = 1;

function getFullXPath(node) {
  if (node.nodeName !== "body" && node.nodeName !== "html" && node.parentNode &&
      node.parentNode.nodeName.toLowerCase() !== "body") 
  {
    return getFullXPath(node.parentNode) + "/" + getChildSelector(node);
  } else {
    return "//" + getChildSelector(node);
  }
}

/** 
 * Gets the XPath bit between two /s for normal elements.
 * @param node The DOM node whose XPath selector to find 
 */
function getChildSelector(node) {
  // Figure out the index of this node amongst its siblings.
  var count = 1;
  var sibling = node.previousSibling;
  while (sibling) {
    if (sibling.nodeType === ELEMENT_NODE_TYPE && sibling.nodeName === node.nodeName) {
      count++;
    }
    sibling = sibling.previousSibling;
  }
  if (count === 1) {
    // This may be the only node of its name, which would make for simpler XPath.
    var onlyNode = true;
    sibling = node.nextSibling;
    while (sibling) {
      if (sibling.nodeType === ELEMENT_NODE_TYPE && sibling.nodeName === node.nodeName) {
        onlyNode = false;
        break;
      }
      sibling = sibling.nextSibling;
    }
    if (onlyNode) {
      return node.nodeName.toLowerCase();
    }
  }

  // It's not the only node, so use the count.
  return node.nodeName.toLowerCase() + "[" + count + "]";
}

/**
 * Get the Xpath to the given node, using HTML-specific attributes.
 * @param node The DOM node whose XPath we want 
 * @param doc The document the node is in 
 */
function getMyXPath(node, doc) {
  // We try a variety of approaches here:
  var nodeName = node.nodeName.toLowerCase();

  // If the node has an ID unique in the document, select by ID.
  if (node.id && !isDynamicID(node.id) && doc.getElementById(node.id) === node) {
    return "//" + nodeName + "[@id='" + node.id + "']";
  }

  // If the node has a class unique in the document, select by class.
  var className = node.className;
  // The XPath syntax to match one class name out of many is atrocious.
  if (className && className.indexOf(' ') === -1 &&
      doc.getElementsByClassName(className).length === 1) 
  {
    return "//" + nodeName + "[@class='" + className + "']";
  }

  // If the node is a label for a field - whose ID we assume is unique, use that.
  if (nodeName === "label" && node.hasAttribute('for')) {
    return "//label[@for='" + node.getAttribute('for') + "']";
  }

  // If the node has a parent node which isn't the body, try the next node up.
  // If the node is a "body" or "html" element, recursing further up leads to trouble -
  // so we give up and just return a child selector. Multiple bodies or htmls are the sign of
  // deeply disturbed HTML, so we can be OK with giving up at this point.
  if (nodeName !== "body" && nodeName !== "html" && node.parentNode &&
      node.parentNode.nodeName.toLowerCase() !== "body") 
  {
    return getMyXPath(node.parentNode, doc) + "/" + getChildSelector(node);
  } else {
    return "//" + getChildSelector(node);
  }
}

/** 
 * Get an Xpath to a node using our knowledge of HTML.
 * Uses label[@for=] classnames, and textContent in addition to tagnames and ids.
 */
function getHtmlXPath(node) {
  var nodeName = node.nodeName.toLowerCase();
  // If we're clicking on the raw "html" area, which is possible if we're clicking below the
  // body for some reason, just return the path to "html".
  if (nodeName === "html") {
    return "//html";
  }
  var myPath = getMyXPath(node, document);
  console.log(myPath);
  var index = myPath.indexOf("']");
  if (index > -1 && index < myPath.length - 2) {

    // contains '], but it is not last characters.
    var text = node.textContent;
    // Escape ' characters.
    text = text.replace(/[']/gm, "&quot;");

    // Attempt to key on the text content of the node for extra precision.
    if (text && text.length < 30) {
      var parent = getMyXPath(node.parentNode, document);
      if (parent.indexOf("']") > -1) {
        var win = window; //window.bridge.getRecordingWindow();
        var attempt = parent.substr(0, parent.indexOf("']") + 2) + "//" + nodeName;
        // If the text contains whitespace characters that aren't spaces, we convert any
        // runs of whitespace into single spaces and trim off the ends, then use the
        // XPath normalize-space command to ensure it will get matched correctly. Otherwise
        // links with eg newlines in them won't work. 
        if (hasNonstandardWhitespace(text)) {
          attempt = attempt + "[normalize-space(.)='" + builder.normalizeWhitespace(text) + "']";
        } else {
          // (But if we can get away without it, do so!)
          attempt = attempt + "[.='" + text + "']";
        }
        // Check this actually works. 
        if (builder.locator.locateElement(win, "xpath", attempt) === node) {
          return attempt;
        }
      }
    }
  }

  return myPath;
}

/** Whether the given text has non-space (0x20) whitespace). */
function hasNonstandardWhitespace(text) {
  return !(/^[ \S]*$/.test(text));
}

/** 
 * Uses the given locator to find the node it identifies. 
 */
function findNode(locatorType, locator) {
  return builder.locator.locateElement(window, locatorType, locator);
}

/** Function from global.js in Windmill, licensed under Apache 2.0. */
function removeHTMLTags(str){
  str = str.replace(/&(lt|gt);/g, function (strMatch, p1) {
    return (p1 === "lt") ? "<" : ">";
  });
  var strTagStrippedText = str.replace(/<\/?[^>]+(>|$)/g, "");
  strTagStrippedText = strTagStrippedText.replace(/&nbsp;/g,"");
  return strTagStrippedText.trim();
}

// From http://stackoverflow.com/questions/2332811/capitalize-words-in-string
builder.locator.capitalize = function(s) {
  return s.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

var transforms = {"uppercase": "toUpperCase", "lowercase": "toLowerCase", "capitalize": "capitalize", "none": "toString"};

/** Given an element, returns its text with CSS text-transforms applies. */
function getCorrectCaseText(el, style) {
  try {
    style = jQuery(el).css('text-transform');
  } catch (e) {}
  style = transforms[style] ? style : "none";
  if (el.nodeType == 3) {
    if (el.textContent[transforms[style]]) {
      return el.textContent[transforms[style]]();
    } else {
      return builder.locator[transforms[style]](el.textContent);
    }
  }
  var bits = [];
  for (var i = 0; i < el.childNodes.length; i++) {
    bits.push(getCorrectCaseText(el.childNodes[i], style));
  }
  return bits.join("");
}

function isDynamicID(val){
	var arr=builder.gatprefs.DEFAULT_OPTIONS['dynamicIDPatterns'];
	var len=arr.length;
	for (var i=0;i<len;i++){
		if (val.match(arr[i])) return true;
	}
	return false;
}
function notRecordIDs(val){
	var arr=builder.gatprefs.DEFAULT_OPTIONS['notRecordIds'];
	var len=arr.length;
	for (var i=0;i<len;i++){
		if (val.match(arr[i])) return true;
	}
	return false;
}
function validIDs(val){
	var arr=builder.gatprefs.DEFAULT_OPTIONS['validIDPatterns'];
	var len=arr.length;
	for (var i=0;i<len;i++){
		if (val.match(arr[i])) return true;
	}
	return false;
}
function preciseXPath(xpath, e){
  //only create more precise xpath if needed
  console.log(xpath);
  if (findNode("xpath", xpath) != e) {
    var result = e.ownerDocument.evaluate(xpath, e.ownerDocument, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    //skip first element (result:0 xpath index:1)
    for (var i=0, len=result.snapshotLength; i < len; i++) {
      var newPath =   "("+xpath + ')[' + (i +1 )+']';
      if (findNode('xpath',newPath) == e ) {
          return newPath ;
      }
    }
  }
  return xpath;
}

function xpathHtmlElement(name) {
  if (window.document.contentType == 'application/xhtml+xml') {
    // "x:" prefix is required when testing XHTML pages
    return "x:" + name;
  } else {
    return name;
  }
}

function attributeValue(value) {
  if (value.indexOf("'") < 0) {
    return "'" + value + "'";
  } else if (value.indexOf('"') < 0) {
    return '"' + value + '"';
  } else {
    var result = 'concat(';
    var part = "";
    while (true) {
      var apos = value.indexOf("'");
      var quot = value.indexOf('"');
      if (apos < 0) {
        result += "'" + value + "'";
        break;
      } else if (quot < 0) {
        result += '"' + value + '"';
        break;
      } else if (quot < apos) {
        part = value.substring(0, apos);
        result += "'" + part + "'";
        value = value.substring(part.length);
      } else {
        part = value.substring(0, quot);
        result += '"' + part + '"';
        value = value.substring(part.length);
      }
      result += ',';
    }
    result += ')';
    return result;
  }
}

function xpathAttribute(e) {
  const PREFERRED_ATTRIBUTES = ['name', 'value','class','type', 'action', 'onclick','id'];
  var i = 0;

  function attributesXPath(name, attNames, attributes) {
    var locator = "//" + xpathHtmlElement(name) + "[";
    var _attrval;
    var _validCnt=0;
    for (i = 0; i < attNames.length; i++) {
      var attName = attNames[i];
      _attrval=attributeValue(attributes[attName]);
      if (attName=='class'){
      	  if (_attrval.indexOf(' ')>=0)
      	    continue;
      }
      if (attName=='id'){
      	  var _dyId=false;
      	  var dids=builder.gatprefs.DEFAULT_OPTIONS['dynamicIDPatterns'];
      	  for (var j=0;j<dids.length;j++){
        	if (_attrval.match(dids[j])) {
        	  _dyId=true;
        	  break;
        	}
          }
          if (_dyId) continue;
      }
      if (_validCnt > 0) {
        locator += " and ";
      }
      locator += '@' + attName + "=" + _attrval;
      _validCnt++;
    }
    locator += "]";
    if (_validCnt==0) return null;
    return preciseXPath(locator, e);
  }

  if (e.attributes) {
    var atts = e.attributes;
    var attsMap = {};
    for (i = 0; i < atts.length; i++) {
      var att = atts[i];
      
      attsMap[att.name] = att.value;
    }
    var names = [];
    // try preferred attributes
    for (i = 0; i < PREFERRED_ATTRIBUTES.length; i++) {
      var name = PREFERRED_ATTRIBUTES[i];
      if (attsMap[name] != null) {
        names.push(name);
        //alert(JSON.stringify(names));
        var locator = attributesXPath.call(this, e.nodeName.toLowerCase(), names, attsMap);
        if (locator!=null){
          if (e == findNode('xpath',locator)) {
            return locator;
          }
        }
      }
    }
  }
  return null;
}

function polygon(e) {
  var path = '';
  var current = e;
  var idx=-1;
  var svg=null;
  var _ret=null;
  if (e.nodeName == 'polygon') {
    idx=builder.locator.getNodeNbr(current);
    if (idx<1) return null;
     while (current != null) {
  	   if (current.parentNode != null) {
  	  	   if (current.parentNode.nodeName=='svg'){
  	  	    svg=current.parentNode;
  	  	    break;
  	  	   }
  	   }
  	   current = current.parentNode;
     }
     if (svg==null) return null;
     current=svg;
     while (current != null) {
  	    if (current.parentNode != null) {
  	  	  if (1 == current.parentNode.nodeType && // ELEMENT_NODE
          current.parentNode.getAttribute("id")){
          	   _ret="//*[@id='"+current.parentNode.getAttribute("id")+"']//*[name()='svg']//*[name()='polygon']["+(idx+1)+"]";
          	   //alert(_ret);
          	   return _ret;
          }
  	    }
  	    current = current.parentNode;
     }
     if (_ret==null) return null;
     return _ret;
  }else
  return null;
  
}

function uncleText(e) {
  var _nodeName=e.nodeName.toLowerCase();
  if (_nodeName == 'a') {
  	  console.log('check uncle text for a');
      var _text=builder.locator.ancestorText(e.parentNode);
      console.log(_text);
      if (_text!=null){
      	  if (e.hasAttribute('accesskey')) {
      	  	//gat2972
            var _key = e.getAttribute('accesskey');
            var _key1=_key.toLowerCase();
            var _key2=_key.toUpperCase();
            var _txt=_text+'/'+_nodeName+"[translate(@accesskey,'"+_key2+"','"+_key1+"')='"+_key1+"']";
            return preciseXPath(_txt,e);
          }else{
      	    _text=preciseXPath(_text+'/'+_nodeName,e);
      	    return _text;
          }
      }
  }
  return null;
}

function descendantText(e) {
  var _nodeName=e.nodeName.toLowerCase();
  if (_nodeName == 'button'||_nodeName == 'td') {
      var _text=descendantText(e,null);
      if (_text!=null){
      	  _text='//'+_nodeName+'[descendant-or-self::'+_text+']';
      	  return preciseXPath(_text,e);
      }
  }
  return null;
}

function imgText(e) {
  if (!e.nodeName) return null;
  var _nodeName=e.nodeName.toLowerCase();
  if (_nodeName == 'img') {
    if (e.alt != '') {
      return preciseXPath("//" + xpathHtmlElement("img") + "[@alt=" + attributeValue(e.alt) + "]", e);
    } else if (e.title != '') {
      return preciseXPath("//" + xpathHtmlElement("img") + "[@title=" + attributeValue(e.title) + "]", e);
    } else if (e.src != '') {
      return preciseXPath("//" + xpathHtmlElement("img") + "[contains(@src," + attributeValue(e.src) + ")]", e);
    }
  }
  return null;
}

console.log('locator');

//if (builder && builder.loader && builder.loader.loadNextMainScript) { builder.loader.loadNextMainScript(); }
