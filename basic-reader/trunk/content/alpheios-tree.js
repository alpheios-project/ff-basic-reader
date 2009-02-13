/**
 * @fileoverview This file contains the Alph.Tree derivation of the Alph.Panel class. 
 * Representation of the Treeology panel.
 * 
 * @version $Id$
 * 
 * Copyright 2008-2009 Cantus Foundation
 * http://alpheios.net
 * 
 * This file is part of Alpheios.
 * 
 * Alpheios is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Alpheios is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


/**
 * @class The Alph.Tree class is the representation of the Treeology
 * panel.
 * @constructor
 * @param {alpheiosPanel} a_panel DOM object bound to the alpheiosPanel tag
 * @see Alph.Panel
 */
Alph.Tree = function(a_panel)
{
    Alph.Panel.call(this,a_panel);
};

/**
 * @ignore
 */
Alph.Tree.prototype = new Alph.Panel();


/**
 * Tree panel specific implementation of
 * {@link Alph.Panel#show}
 * @return the new panel status
 * @type int
 */
Alph.Tree.prototype.show = function()
{
    var panel_obj = this;
    var bro = Alph.main.getCurrentBrowser();
    var treeDoc = Alph.$("browser",this.panel_elem).get(0).contentDocument;
    // clear out the prior tree
    Alph.$("#dependency-tree", treeDoc).empty();
    var sentence  = Alph.$(".alph-proto-sentence",bro.contentDocument);
    if (sentence.length == 0)
    {
        // Just add the default message to the display
        var svgXML = (new DOMParser()).parseFromString(
            '<svg xmlns="http://www.w3.org/2000/svg">' +
            '<g><text class="error">' +
            "No dependency tree information available for this text." +
            "</text></g>" +
            "</svg>",
            "text/xml");
        try 
        {
            Alph.$("#dependency-tree", treeDoc).
                            append(svgXML.firstChild.childNodes);
            svgXML = Alph.$("#dependency-tree", treeDoc).get(0);
            position(svgXML.getElementsByTagName('g').item(0),
                true,
                marginLeft,
                marginTop + fontSize,
                0);
            svgXML.setAttribute("width", returned[2]);
            svgXML.setAttribute("height", returned[3]);
        }
        catch(e)
        {
            Alph.util.log(e);
        }
    }
    else
    {
        var treebankDoc = document.implementation.createDocument("", "", null);
        treebankDoc.async = false;
        treebankDoc.load("chrome://alpheios-greek/content/testtree.xml");

        var xsltProc = new XSLTProcessor();
        try
        {
            var xsltDoc = document.implementation.createDocument("", "", null);
            xsltDoc.async = false;
            xsltDoc.load("chrome://alpheios/skin/aldt2svg.xsl");
            xsltProc.importStylesheet(xsltDoc);
        }
        catch (e)
        {
            Alph.util.log(e);
        }

        
        Alph.$(sentence).each
        (
            function(a_i)
            {
                try
                {
                    var sentenceId = "#" + Alph.$(this).attr("id");
                    var aldtXML = Alph.$(sentenceId,treebankDoc).get(0);
                    var xmlSerializer = new XMLSerializer();
                    var svgXML;

                    // if no treebank data found, use error message
                    if (aldtXML == null)
                    {
                        svgXML = (new DOMParser()).parseFromString(
                            '<svg xmlns="http://www.w3.org/2000/svg">' +
                              '<g><text class="error">' +
                                "No dependency tree information available for this text." +
                              "</text></g>" +
                            "</svg>",
                            "text/xml");
                    }
                    // if treebank data found, transform it to SVG
                    else
                    {
//                      Alph.util.log("ALDT: " +
//                                    xmlSerializer.serializeToString(aldtXML));
                        svgXML = xsltProc.transformToDocument(aldtXML);
                    }

                    // insert new SVG in tree, then retrieve it
                    // (text width computation doesn't work without
                    // this before calling position())
                    Alph.$("#dependency-tree", treeDoc).
                            append(svgXML.firstChild.childNodes);
                    svgXML = Alph.$("#dependency-tree", treeDoc).get(0);

//                  Alph.util.log("SVG before: " +
//                                xmlSerializer.serializeToString(svgXML));
                    var returned =
                            position(svgXML.getElementsByTagName('g').item(0),
                                     true,
                                     marginLeft,
                                     marginTop + fontSize,
                                     0);
                    svgXML.setAttribute("width", returned[2]);
                    svgXML.setAttribute("height", returned[3]);
                    Alph.util.log("SVG: " +
                                  xmlSerializer.serializeToString(svgXML));
                }
                catch (e)
                {
                    Alph.util.log(e);
                }
            }
        );
    }
    
    // make sure to update the detached window document too...
    // update the panel document whether or not the window is detached
    // because otherwise the screen doesn't seem to redraw right
    if (this.panel_window != null)
    {
        var window_doc = 
            this.panel_window.Alph.$("#" + this.panel_id + " browser").get(0).contentDocument;
        var panel_tree = Alph.$("#dependency-tree", treeDoc);
        Alph.$("#dependency-tree", window_doc).empty();
        Alph.$("#dependency-tree", window_doc).append(Alph.$(panel_tree).children().clone());
        Alph.$("#dependency-tree", window_doc).attr("width",Alph.$(panel_tree).attr("width"));
        Alph.$("#dependency-tree", window_doc).attr("height",Alph.$(panel_tree).attr("height"));
        this.panel_window.focus();
    }
    
    return Alph.Panel.STATUS_SHOW;
    
};

/**
 * Tree panel specific implementation of
 * {@link Alph.Panel#get_detach_chrome}
 * @return the chrome url as a string
 * @type String
 */
Alph.Tree.prototype.get_detach_chrome = function()
{
    return 'chrome://alpheios/content/alpheios-tree-window.xul';
}

/*
 * The following code is adapted from SVG tree drawer
 * Copyright (C) 2004 Weston Ruter <http://weston.ruter.net/>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will core useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
 */

var fontSize = 20;
var wordSpacing = 20; //wordSpacing/2 == text padding
var marginLeft = 10;
var marginTop = 0;
var branchHeight = fontSize * 3;
var branchPaddingTop = fontSize/4;
var branchPaddingBottom = 0;

//position the nodes in a tree structure
function position(a_containerNode,
                  a_isRoot,
                  a_shiftLeft,
                  a_shiftTop,
                  a_parentWidth)
{
    var isEmpty = false;
    var childrenWidth = 0;
    var children = Array();
    var nodeLabel;
    var nodeLabelWidth;
    var nodeBranch;
    var lineLabel;
    var maxX = 0;
    var maxY = 0;

    //get and handle children ============================
    for (var i = 0; i < a_containerNode.childNodes.length; i++)
    {
        var node = a_containerNode.childNodes.item(i);
        var nodeName = node.nodeName;

        if ((nodeName == "text") &&
            (node.getAttribute("class") == "line-label"))
        {
            lineLabel = node;
        }
        else if (nodeName == "text")
        {
            nodeLabel = node;

            //determine the width of the label
            if (!nodeLabel.firstChild ||
                !nodeLabel.firstChild.nodeValue ||
                nodeLabel.firstChild.nodeValue.match(/^\s*$/))
            {
                nodeLabelWidth = wordSpacing;
                isEmpty = true;
            }
            else
            {
                nodeLabelWidth = wordSpacing +
                                 nodeLabel.getComputedTextLength();
                isEmpty = false;
            }
            if (nodeLabelWidth < a_parentWidth)
                nodeLabelWidth = a_parentWidth;
        }
        //connecting branch
        else if (nodeName == "line")
        {
            nodeBranch = node;
        }
        //children nodes
        else if (nodeName == "g")
        {
            var returned =
                  position(node,
                           false,
                           a_shiftLeft + childrenWidth,
                           a_shiftTop + (isEmpty ? branchHeight :
                                                   branchHeight + fontSize),
                           nodeLabelWidth);
            children.push(returned[0]);
            childrenWidth += returned[1];

            // update size
            if (returned[2] > maxX)
                maxX = returned[2];
            if (returned[3] > maxY)
                maxY = returned[3];
        }
    }

    //draw label, children, and branches ==================
    if (!childrenWidth) //there are no children; this is the branch end
        childrenWidth = nodeLabelWidth;
    if (nodeLabel == null)
        throw Error("Error: Every child must have a label");

    //position label
    var thisY = a_shiftTop;
    var thisX;
    if (children.length)
    {
        var firstChild =
                parseFloat(children[0].nodeLabel.getAttribute('x'));
        var lastChild =
                parseFloat(children[children.length-1].
                                nodeLabel.
                                getAttribute('x'));
        thisX = (firstChild + lastChild)/2;
    }
    else
        thisX = a_shiftLeft + childrenWidth/2;
    nodeLabel.setAttribute('y', thisY + 'px');
    nodeLabel.setAttribute('x', thisX + 'px');
    thisY += (isEmpty ? -fontSize : branchPaddingTop);

    //connect branches from child labels to parent label
    //and position line labels
    for (var i = 0; i < children.length; i++)
    {
        // set this end of line
        var node = children[i].branch;
        node.setAttribute('x1', thisX + 'px');
        node.setAttribute('y1', thisY + 'px');

        // position label
        var label = children[i].lineLabel;
        var width = label.getComputedTextLength() + wordSpacing;
        var midX = (thisX + parseFloat(node.getAttribute('x2'))) / 2;
        midX += ((midX <= thisX) ? -width/2 : width/2);
        var midY = (thisY + parseFloat(node.getAttribute('y2'))) / 2;
        label.setAttribute('x', midX + 'px');
        label.setAttribute('y', midY + 'px');
    }

    // update size
    thisX += nodeLabelWidth/2;
    if (thisX > maxX)
        maxX = thisX;
    thisY += (isEmpty ? 0: fontSize);
    if (thisY > maxY)
        maxY = thisY;

    //below root: anchor one end of the branch to the label
    if (!a_isRoot)
    {
        if (nodeBranch)
        {
            nodeBranch.setAttribute('x2', nodeLabel.getAttribute('x'));
            nodeBranch.setAttribute(
                            'y2',
                            (parseFloat(nodeLabel.getAttribute('y')) -
                             fontSize - branchPaddingBottom) +
                            'px');
        }
    }

    return Array({nodeLabel:nodeLabel, lineLabel:lineLabel, branch:nodeBranch},
                 childrenWidth,
                 maxX,
                 maxY);
}
