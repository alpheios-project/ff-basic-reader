<?xml version="1.0" encoding="UTF-8"?>

<!--
  Copyright 2008-2009 Cantus Foundation
  http://alpheios.net
 
  This file is part of Alpheios.
 
  Alpheios is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
 
  Alpheios is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
 
  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 -->

<!--
  Stylesheet for transforming lexicon output to HTML
-->

<xsl:stylesheet
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  xmlns:exsl="http://exslt.org/common"
  version="1.0"
  exclude-result-prefixes="xs">

  <xsl:import href="beta2unicode.xsl"/>

  <xsl:template match="/">
    <html>
      <head>
        <link rel="stylesheet" type="text/css" href="alpheios.css"/>
      </head>
      <body>
        <div id="alph-text">
          <xsl:apply-templates select="//word|//error|//unknown"/>
        </div>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="word">
    <div class="alph-word">
      <!-- set context to word form if present -->
      <!-- converting betacode to unicode if necessary -->
      <xsl:if test="form">
        <xsl:attribute name="context">
          <xsl:call-template name="convert-text">
            <xsl:with-param name="item" select="form"/>
          </xsl:call-template>
        </xsl:attribute>
      </xsl:if>

      <!-- sort entries by decreasing frequency of occurrence -->
      <!-- and then by part of speech -->
      <!-- arbitrarily choosing the first in the rare case where multiple dict elements exist -->
      <xsl:for-each select="entry">
        <xsl:sort select="dict[1]/freq/@order" data-type="number"
          order="descending"/>
        <xsl:sort select="dict[1]/pofs/@order" data-type="number"
          order="descending"/>

        <div class="alph-entry">

          <!-- process dictionary info and meanings -->
          <xsl:for-each select="dict|mean">
            <xsl:apply-templates select="."/>
          </xsl:for-each>

          <xsl:variable name="infl_sets">
          <!-- process all forms having no dialect -->
          <xsl:for-each select="infl[not(dial)]">
            <xsl:sort select="term/stem"/>
            <xsl:sort select="pofs/@order" data-type="number" order="descending"/>
            <xsl:variable name="last-stem" select="term/stem"/>
            <xsl:variable name="last-pofs" select="pofs"/>
            <xsl:variable name="last-comp" select="comp"/>
            <xsl:variable name="last-stemtype" select="stemtype"/>
            <xsl:variable name="preceding"
              select="preceding-sibling::infl[(term/stem=$last-stem) and
                                              (pofs=$last-pofs) and
                                              ((not(comp) and not($last-comp)) or
                                               (comp=$last-comp)) and
                                              ((not(stemtype) and not($last-stemtype)) or
                                               (stemtype=$last-stemtype)) and
                                               not(dial)]"/>
            <xsl:if test="count($preceding) = 0">
              <!-- process all inflections having this form (stem and part-of-speech) -->
              <xsl:call-template name="inflection-set">
                <xsl:with-param name="inflections"
                  select="../infl[(term/stem=$last-stem) and
                                  (pofs=$last-pofs) and
                                  ((not(comp) and not($last-comp)) or
                                  (comp=$last-comp)) and
                                  ((not(stemtype) and not($last-stemtype)) or
                                   (stemtype=$last-stemtype)) and
                                  not(dial)]"
                />
              </xsl:call-template>
            </xsl:if>
          </xsl:for-each>
          <!-- handle any forms that have no dialect and no stem or part of speech-->
          <xsl:call-template name="inflection-set">
            <xsl:with-param name="inflections"
              select="infl[not(dial) and (not(term/stem) or not(pofs))]"/>
          </xsl:call-template>
          <!-- process all forms having dialect -->
          <xsl:for-each select="infl[dial]">
            <xsl:sort select="term/stem"/>
            <xsl:sort select="pofs/@order" data-type="number" order="descending"/>
            <xsl:sort select="dial"/>
            <xsl:variable name="last-stem" select="term/stem"/>
            <xsl:variable name="last-pofs" select="pofs"/>
            <xsl:variable name="last-dial" select="dial"/>
            <xsl:variable name="last-comp" select="comp"/>
            <xsl:variable name="last-stemtype" select="stemtype"/>
            <xsl:variable name="preceding"
              select="preceding-sibling::infl[(term/stem=$last-stem) and
                                              (pofs=$last-pofs) and
                                              (dial=$last-dial) and
                                              ((not(comp) and not($last-comp)) or
                                               (comp=$last-comp)) and
                                              ((not(stemtype) and not($last-stemtype)) or
                                               (stemtype=$last-stemtype)) and
                                              dial]">
            </xsl:variable>
            <xsl:if test="count($preceding) = 0">
              <!-- process all inflections having this form (stem and part-of-speech) -->
              <xsl:call-template name="inflection-set">
                <xsl:with-param name="inflections"
                  select="../infl[(term/stem=$last-stem) and
                                  (pofs=$last-pofs) and
                                  (dial=$last-dial) and
                                  ((not(comp) and not($last-comp)) or
                                   (comp=$last-comp)) and
                                  ((not(stemtype) and not($last-stemtype)) or
                                   (stemtype=$last-stemtype)) and
                                  dial]"/>
              </xsl:call-template>
            </xsl:if>
          </xsl:for-each>
          <!-- handle any forms that have dialect and no stem or part of speech-->
          <xsl:for-each select="infl[dial and (not(term/stem) or not(pofs))]">
            <xsl:sort select="dial"/>
            <xsl:variable name="last-dial" select="dial"/>
            <xsl:variable name="last-comp" select="comp"/>
            <xsl:variable name="last-stemtype" select="stemtype"/>
            <xsl:variable name="preceding"
              select="preceding-sibling::infl[(dial=$last-dial) and
                                              ((not(comp) and not($last-comp)) or
                                               (comp=$last-comp)) and
                                              ((not(stemtype) and not($last-stemtype)) or
                                               (stemtype=$last-stemtype)) and
                                              dial and
                                              (not(term/stem) or not(pofs))]"/>
            <xsl:if test="count($preceding) = 0">
              <xsl:call-template name="inflection-set">
                <xsl:with-param name="inflections"
                  select="../infl[(dial=$last-dial) and
                                  ((not(comp) and not($last-comp)) or
                                   (comp=$last-comp)) and
                                  ((not(stemtype) and not($last-stemtype)) or
                                   (stemtype=$last-stemtype)) and
                                   dial and
                                   (not(term/stem) or not(pofs))]"/>
              </xsl:call-template>
            </xsl:if>
          </xsl:for-each>
          </xsl:variable>
          
          <!-- process inflected forms -->
          <xsl:if test="$infl_sets != ''">
            <!-- one label for all forms -->
            <div class="alpheios-label">Form(s):</div>
            <xsl:copy-of select="$infl_sets"/>
          </xsl:if>
          
          
        </div>
      </xsl:for-each>
      <!-- end for each entry -->
    </div>
  </xsl:template>
  <!-- end match word -->

  <xsl:template match="unknown">
    <div class="alph-unknown">
      <xsl:text>Unknown: </xsl:text>
      <span class="alph-hdwd">
        <xsl:call-template name="convert-text">
          <xsl:with-param name="item" select="."/>
        </xsl:call-template>
      </span>
    </div>
  </xsl:template>

  <xsl:template match="error">
    <div class="alph-error">
      <xsl:text>Error: </xsl:text>
      <span class="alph-hdwd">
        <xsl:value-of select="."/>
      </span>
    </div>
  </xsl:template>

  <xsl:template match="dict">
    <xsl:element name="div">
      <xsl:attribute name="class">alph-dict</xsl:attribute>
      <xsl:attribute name="lemma-key">
        <xsl:call-template name="convert-text">
          <xsl:with-param name="item" select="hdwd"/>
        </xsl:call-template>
      </xsl:attribute>

      <!-- define order in which elements should appear -->
      <xsl:choose>
        <xsl:when test="hdwd">
          <xsl:call-template name="item-plus-text">
            <xsl:with-param name="item" select="hdwd"/>
            <xsl:with-param name="suffix" select="': '"/>
            <xsl:with-param name="strip-sense" select="true()"/>
          </xsl:call-template>
        </xsl:when>
        <xsl:when test="../infl[1]/term">
          <xsl:variable name="hdwd">
            <hdwd>
              <xsl:attribute name="xml:lang">
                <xsl:value-of select="../infl[1]/term/@xml:lang"/>
              </xsl:attribute>
              <xsl:for-each select="../infl[1]/term/*">
                <xsl:value-of select="./text()"/>
              </xsl:for-each>
            </hdwd>
          </xsl:variable>
          <span class="alph-hdwd">
            <xsl:call-template name="convert-text">
              <xsl:with-param name="item" select="exsl:node-set($hdwd)"/>
              <xsl:with-param name="strip-sense" select="true()"/>
            </xsl:call-template>
            <xsl:text>: </xsl:text>
          </span>
        </xsl:when>
      </xsl:choose>
      <xsl:call-template name="item-plus-text">
        <xsl:with-param name="item" select="pron"/>
        <xsl:with-param name="prefix" select="'['"/>
        <xsl:with-param name="suffix" select="'] '"/>
      </xsl:call-template>

      <!-- Note:  Only one of case, gender, or kind can appear,
           depending on part of speech, therefore we can pass all
           through a single parameter -->
      <xsl:element name="div">
        <xsl:attribute name="class">alph-morph</xsl:attribute>
        <xsl:choose>
          <xsl:when test="pofs">
            <xsl:call-template name="part-of-speech">
              <xsl:with-param name="attr" select="case|gend|kind"/>
              <xsl:with-param name="pofs" select="pofs"/>
            </xsl:call-template>
          </xsl:when>
          <xsl:when test="../infl[1]/pofs">
            <xsl:call-template name="part-of-speech">
              <xsl:with-param name="attr" select="case|gend|kind"/>
              <xsl:with-param name="pofs" select="../infl[1]/pofs"/>
            </xsl:call-template>
          </xsl:when>
        </xsl:choose>
        <xsl:variable name="pofs">
          <xsl:choose>
            <xsl:when test="pofs">
              <xsl:value-of select="pofs"/>
            </xsl:when>
            <xsl:when test="../infl[1]/pofs">
              <xsl:value-of select="../infl[1]/pofs"/>
            </xsl:when>
          </xsl:choose>
        </xsl:variable>
        <xsl:choose>
          <xsl:when test="decl">
            <xsl:call-template name="declension">
              <xsl:with-param name="item" select="decl"/>
              <xsl:with-param name="pofs" select="$pofs"/>
            </xsl:call-template>
          </xsl:when>
          <xsl:when test="../infl[1]/decl">
            <xsl:call-template name="declension">
              <xsl:with-param name="item" select="../infl[1]/decl"/>
              <xsl:with-param name="pofs" select="$pofs"/>
            </xsl:call-template>
          </xsl:when>
        </xsl:choose>
        <xsl:choose>
          <xsl:when test="conj">
            <xsl:call-template name="item-plus-text-plus-context">
              <xsl:with-param name="item" select="conj"/>
              <xsl:with-param name="suffix" select="' conjugation'"/>
            </xsl:call-template>
          </xsl:when>
          <xsl:when test="../infl[1]/conj">
            <xsl:call-template name="item-plus-text-plus-context">
              <xsl:with-param name="item" select="../infl[1]/conj"/>
              <xsl:with-param name="suffix" select="' conjugation'"/>
            </xsl:call-template>
          </xsl:when>
        </xsl:choose>
        <xsl:call-template name="parenthesize">
          <xsl:with-param name="items" select="age|area|geo|freq"/>
          <xsl:with-param name="span-name">attrlist</xsl:with-param>
          <xsl:with-param name="span-context"/>
        </xsl:call-template>
        <xsl:call-template name="item-plus-text">
          <xsl:with-param name="item" select="src"/>
          <xsl:with-param name="prefix" select="'['"/>
          <xsl:with-param name="suffix" select="']'"/>
        </xsl:call-template>
        <xsl:call-template name="item-plus-text">
          <xsl:with-param name="item" select="note"/>
        </xsl:call-template>
      </xsl:element>
    </xsl:element>
  </xsl:template>

  <xsl:template match="mean">
    <div class="alph-mean">
      <xsl:value-of select="."/>
    </div>
  </xsl:template>

  <xsl:template name="part-of-speech">
    <xsl:param name="attr"/>
    <xsl:param name="pofs"/>

    <xsl:if test="$attr|$pofs">
      <span class="alph-pofs" context="{translate($pofs,' ','_')}">
        <xsl:choose>
          <!-- say "verb taking <x>" rather than "taking <x> verb" -->
          <xsl:when test="starts-with($attr,'taking ')">
            <xsl:value-of select="$pofs"/>
            <xsl:text> </xsl:text>
            <span class="alph-attr">
              <xsl:value-of select="$attr"/>
            </span>
          </xsl:when>
          <xsl:otherwise>
            <!-- all other attributes come before part of speech-->
            <xsl:if test="$attr">
              <span class="alph-attr">
                <xsl:value-of select="$attr"/>
              </span>
            </xsl:if>
            <xsl:value-of select="$pofs"/>
          </xsl:otherwise>
        </xsl:choose>
      </span>
    </xsl:if>
  </xsl:template>

  <xsl:template name="parenthesize">
    <xsl:param name="items"/>
    <xsl:param name="span-name"/>
    <xsl:param name="span-context"/>

    <xsl:if test="$items">
      <span>
        <!-- if argument specifies class -->
        <xsl:if test="$span-name">
          <xsl:attribute name="class">
            <xsl:value-of select="concat('alph-', $span-name)"/>
          </xsl:attribute>
        </xsl:if>

        <!-- if argument specifies context -->
        <xsl:if test="$span-context">
          <xsl:attribute name="context">
            <xsl:value-of select="translate($span-context, ' ', '_')"/>
          </xsl:attribute>
        </xsl:if>

        <xsl:text>(</xsl:text>

        <!-- for each item supplied -->
        <xsl:for-each select="$items">
          <xsl:if test="position() != 1">, </xsl:if>
          <span>
            <xsl:attribute name="class">
              <xsl:choose>
                <!-- if item specifies class -->
                <xsl:when test="./@span-name">
                  <xsl:value-of
                    select="concat('alph-nopad alph-', ./@span-name)"/>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:text>alph-nopad</xsl:text>
                </xsl:otherwise>
              </xsl:choose>
            </xsl:attribute>

            <!-- if item specifies context -->
            <xsl:if test="./@span-context">
              <xsl:attribute name="context">
                <xsl:value-of select="translate(./@span-context, ' ', '_')"/>
              </xsl:attribute>
            </xsl:if>

            <xsl:value-of select="."/>
          </span>
        </xsl:for-each>

        <xsl:text>)</xsl:text>
      </span>
    </xsl:if>
  </xsl:template>

  <xsl:template name="inflection-set">
    <xsl:param name="inflections"/>
    <xsl:variable name="pofs" select="$inflections[1]/pofs"/>

    <!-- if non-empty set -->
    <!-- ignore various parts of speech for which -->
    <!-- inflection adds nothing to dict info -->
    <xsl:if
      test="$inflections and
                  (not($pofs) or
                   (($pofs != 'conjunction') and
                    ($pofs != 'preposition') and
                    ($pofs != 'interjection') and
                    ($pofs != 'particle')))">
      <!-- add the term as the value of the context attribute for the
                 inflection set -->
      <xsl:variable name="term" select="$inflections[1]/term"/>
      <xsl:variable name="comp" select="$inflections[1]/comp"/>
      <div class="alph-infl-set">
        <xsl:attribute name="context">
          <xsl:call-template name="convert-text">
            <xsl:with-param name="item" select="$inflections[1]/term"/>
          </xsl:call-template>
        </xsl:attribute>
        <xsl:apply-templates select="$term"/>
        <xsl:if test="$inflections[1]/pofs != $inflections[1]/../dict[1]/pofs">
          <xsl:call-template name="parenthesize">
            <xsl:with-param name="items" select="$inflections[1]/pofs"/>
            <xsl:with-param name="span-name">pofs</xsl:with-param>
            <xsl:with-param name="span-context" select="$inflections[1]/pofs"/>
          </xsl:call-template>
        </xsl:if>
        <xsl:call-template name="parenthesize">
          <xsl:with-param name="items" select="$inflections[1]/dial"/>
          <xsl:with-param name="span-name">dial</xsl:with-param>
          <xsl:with-param name="span-context" select="$inflections[1]/dial"/>
        </xsl:call-template>
        <xsl:variable name="dsm-items">
          <xsl:if test="$inflections[1]/derivtype">
            <item>
              <xsl:attribute name="span-name">derivtype</xsl:attribute>
              <xsl:attribute name="span-context">
                <xsl:value-of select="$inflections[1]/derivtype"/>
              </xsl:attribute>
              <xsl:text>d=</xsl:text>
              <xsl:value-of select="$inflections[1]/derivtype"/>
            </item>
          </xsl:if>
          <xsl:if test="$inflections[1]/stemtype">
            <item>
              <xsl:attribute name="span-name">stemtype</xsl:attribute>
              <xsl:attribute name="span-context">
                <xsl:value-of select="$inflections[1]/stemtype"/>
              </xsl:attribute>
              <xsl:text>s=</xsl:text>
              <xsl:value-of select="$inflections[1]/stemtype"/>
            </item>
          </xsl:if>
          <xsl:if test="$inflections[1]/morph">
            <item>
              <xsl:attribute name="span-name">morphflags</xsl:attribute>
              <xsl:attribute name="span-context">
                <xsl:value-of select="$inflections[1]/morph"/>
              </xsl:attribute>
              <xsl:text>m=</xsl:text>
              <xsl:value-of select="$inflections[1]/morph"/>
            </item>
          </xsl:if>
        </xsl:variable>
        <xsl:call-template name="parenthesize">
          <xsl:with-param name="items"
                          select="exsl:node-set($dsm-items)/item"/>
        </xsl:call-template>

        <!-- decide how to display form based on structure -->
        <xsl:choose>

          <!-- if inflections have case -->
          <xsl:when test="$inflections/case">
            <!-- process singular case list -->
            <xsl:if test="count($inflections[num = 'singular']/case)">
              <div class="alph-infl">
                <xsl:text>Singular: </xsl:text>
                <xsl:for-each select="$inflections[num = 'singular']/case">
                  <xsl:sort select="./@order" data-type="number"
                    order="descending"/>
                  <xsl:apply-templates select="."/>
                </xsl:for-each>
                
                <!--handle voice and tense -->
                <xsl:for-each select="$inflections[ num = 'singular' and tense]">
                  <xsl:call-template name="item-plus-text-plus-context">
                    <xsl:with-param name="item" select="tense"/>
                  </xsl:call-template>
                  <xsl:apply-templates select="voice"/>
                </xsl:for-each>

                <!-- handle comparative -->
                <xsl:if test="$comp and ($comp != 'positive')">
                  <xsl:apply-templates select="$inflections[1]/comp"/>
                </xsl:if>
              </div>
            </xsl:if>

            <!-- process dual case list -->
            <xsl:if test="count($inflections[num = 'dual']/case)">
              <div class="alph-infl">
                <xsl:text>Dual: </xsl:text>
                <xsl:for-each select="$inflections[num = 'dual']/case">
                  <xsl:sort select="./@order" data-type="number"
                    order="descending"/>
                  <xsl:apply-templates select="."/>
                </xsl:for-each>

                <!--handle voice and tense -->
                <xsl:for-each select="$inflections[ num = 'dual' and tense]">
                  <xsl:call-template name="item-plus-text-plus-context">
                    <xsl:with-param name="item" select="tense"/>
                  </xsl:call-template>
                  <xsl:apply-templates select="voice"/>
                </xsl:for-each>
                
                <!-- handle comparative -->
                <xsl:if test="$comp and ($comp != 'positive')">
                  <xsl:apply-templates select="$inflections[1]/comp"/>
                </xsl:if>
                                
              </div>
            </xsl:if>

            <!-- process plural case list -->
            <xsl:if test="count($inflections[num = 'plural']/case)">
              <div class="alph-infl">
                <xsl:text>Plural: </xsl:text>
                <xsl:for-each select="$inflections[num = 'plural']/case">
                  <xsl:sort select="./@order" data-type="number"
                    order="descending"/>
                  <xsl:apply-templates select="."/>
                </xsl:for-each>

                <xsl:for-each select="$inflections[ num = 'plural' and tense]">
                  <xsl:call-template name="item-plus-text-plus-context">
                    <xsl:with-param name="item" select="tense"/>
                  </xsl:call-template>
                  <xsl:apply-templates select="voice"/>
                </xsl:for-each>
                
                <!-- handle comparative -->
                <xsl:if test="$comp and ($comp != 'positive')">
                  <xsl:apply-templates select="$inflections[1]/comp"/>
                </xsl:if>
                
              </div>
            </xsl:if>

            <!-- process other case list -->
            <xsl:if test="count($inflections[not(num)]/case)">
              <div class="alph-infl">
                <xsl:text>Case: </xsl:text>
                <xsl:for-each select="$inflections[not(num)]/case">
                  <xsl:sort select="./@order" data-type="number"
                    order="descending"/>
                  <xsl:apply-templates select="."/>
                </xsl:for-each>

                <xsl:for-each select="$inflections[ not(num) and tense]">
                  <xsl:call-template name="item-plus-text-plus-context">
                    <xsl:with-param name="item" select="tense"/>
                  </xsl:call-template>
                  <xsl:apply-templates select="voice"/>
                </xsl:for-each>
                
                <!-- handle comparative -->
                <xsl:if test="$comp and ($comp != 'positive')">
                  <xsl:apply-templates select="$inflections[1]/comp"/>
                </xsl:if>
                
              </div>
            </xsl:if>
            
          </xsl:when>
          <!-- end when inflections have case -->
          

          <!-- verb inflection -->
          <!-- verbs with tense -->
          <xsl:when test="$inflections/tense">
            <xsl:for-each select="$inflections[tense]">
              <div class="alph-infl">
                <xsl:call-template name="item-plus-text-plus-context">
                  <xsl:with-param name="item" select="pers"/>
                  <xsl:with-param name="suffix" select="' person'"/>
                </xsl:call-template>
                <xsl:call-template name="item-plus-text-plus-context">
                  <xsl:with-param name="item" select="num"/>
                  <xsl:with-param name="suffix" select="';'"/>
                </xsl:call-template>
                <xsl:call-template name="item-plus-text-plus-context">
                  <xsl:with-param name="item" select="tense"/>
                </xsl:call-template>
                <xsl:call-template name="item-plus-text-plus-context">
                  <xsl:with-param name="item" select="mood"/>
                  <xsl:with-param name="suffix" select="';'"/>
                </xsl:call-template>
                <xsl:apply-templates select="voice"/>
              </div>
            </xsl:for-each>
          </xsl:when>

          <!-- verbs with no tense -->
          <xsl:when test="$inflections[1]/pofs = 'verb'">
            <div class="alph-infl">
              <xsl:call-template name="item-plus-text-plus-context">
                <xsl:with-param name="item" select="pers"/>
                <xsl:with-param name="suffix" select="' person'"/>
              </xsl:call-template>
              <xsl:call-template name="item-plus-text-plus-context">
                <xsl:with-param name="item" select="num"/>
                <xsl:with-param name="suffix" select="';'"/>
              </xsl:call-template>
              <xsl:call-template name="item-plus-text-plus-context">
                <xsl:with-param name="item" select="mood"/>
                <xsl:with-param name="suffix" select="';'"/>
              </xsl:call-template>
              <xsl:apply-templates select="voice"/>
            </div>
          </xsl:when>
          <!-- end verb inflection -->

          <!-- adverb inflection -->
          <xsl:when test="$inflections[1]/pofs = 'adverb'">
            <xsl:if test="comp and (comp != 'positive')">
              <div class="alph-infl">
                <xsl:apply-templates select="comp"/>
              </div>
            </xsl:if>
          </xsl:when>
          <!-- end adverb inflection -->

          <!-- miscellaneous others -->
          <xsl:otherwise>
            <div class="alph-infl">
              <xsl:apply-templates select="gend"/>
              <xsl:if test="comp and (comp != 'positive')">
                <xsl:apply-templates select="comp"/>
              </xsl:if>
            </div>
          </xsl:otherwise>
        </xsl:choose>
      </div>
    </xsl:if>
  </xsl:template>

  <xsl:template match="term">
    <span class="alph-term">
      <xsl:call-template name="convert-text">
        <xsl:with-param name="item" select="stem"/>
        <!-- force final s to become medial not final sigma -->
        <!-- if there's a suffix -->
        <xsl:with-param name="partial" select="count(suff) > 0"/>
      </xsl:call-template>
      <xsl:if test="suff">
        <xsl:text>-</xsl:text>
      </xsl:if>
      <span class="alph-suff">
        <xsl:call-template name="convert-text">
          <xsl:with-param name="item" select="suff"/>
        </xsl:call-template>
      </span>
    </span>
  </xsl:template>

  <!--  Templates to handle simple text elements -->
  <xsl:template match="*">
    <span class="alph-{name(.)}">
      <xsl:value-of select="."/>
    </span>
  </xsl:template>

  <xsl:template match="case">
    <xsl:variable name="num" select="../num"/>
    <xsl:variable name="gend" select="../gend"/>
    <xsl:variable name="pofs" select="../pofs"/>
    <xsl:variable name="context">
      <xsl:value-of select="."/>
      <xsl:text>-</xsl:text>
      <xsl:value-of select="$num"/>
      <xsl:text>-</xsl:text>
      <xsl:value-of select="$gend"/>
      <xsl:text>-</xsl:text>
      <xsl:value-of select="$pofs"/>
    </xsl:variable>
    <span class="alph-case" context="{translate($context,' ','_')}"
      alph-num="{$num}" alph-gend="{$gend}" alph-pofs="{translate($pofs,' ','_')}">
      <xsl:value-of select="."/>
      <xsl:if
        test="(../pofs='pronoun' or
               ../pofs='adjective' or
               ../pofs='article' or
               ../pofs='supine' or
               ../pofs='verb participle' or
               ((../pofs='noun') and (../gend!=../../dict/gend))) and ../gend">
        <xsl:choose>
          <xsl:when test="$gend='masculine'">
            <xsl:text> (m)</xsl:text>
          </xsl:when>
          <xsl:when test="$gend='feminine'">
            <xsl:text> (f)</xsl:text>
          </xsl:when>
          <xsl:when test="$gend='neuter'">
            <xsl:text> (n)</xsl:text>
          </xsl:when>
          <xsl:when test="$gend='all'">
            <xsl:text> (all)</xsl:text>
          </xsl:when>
          <xsl:when test="$gend='common'">
            <xsl:text> (common)</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text> (?)</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:if>
    </span>
  </xsl:template>

  <!-- declensions -->
  <!-- turn "x" into "x declension" -->
  <!-- turn "x & y" into "x" & "y declension" -->
  <xsl:template name="declension">
    <xsl:param name="item"/>
    <xsl:param name="pofs"/>

    <!-- append '_adjective' to context if adjective, else no suffix -->
    <xsl:variable name="context-suffix">
      <xsl:choose>
        <xsl:when test="$pofs = 'adjective'">
          <xsl:value-of select="'_adjective'"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="''"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:for-each select="$item">
      <xsl:choose>
        <!-- if x & y -->
        <xsl:when test="contains(., ' &amp; ')">
          <!-- create x -->
          <xsl:variable name="first">
            <decl>
              <xsl:value-of select="substring-before(., ' &amp; ')"/>
            </decl>
          </xsl:variable>
          <xsl:call-template name="item-plus-text-plus-context">
            <xsl:with-param name="item" select="exsl:node-set($first)"/>
            <xsl:with-param name="name" select="'decl'"/>
            <xsl:with-param name="context-suffix" select="$context-suffix"/>
          </xsl:call-template>
          <xsl:text>&amp; </xsl:text>
          <!-- create y -->
          <xsl:variable name="second">
            <decl>
              <xsl:value-of select="substring-after(., ' &amp; ')"/>
            </decl>
          </xsl:variable>
          <xsl:call-template name="item-plus-text-plus-context">
            <xsl:with-param name="item" select="exsl:node-set($second)"/>
            <xsl:with-param name="name" select="'decl'"/>
            <xsl:with-param name="suffix" select="' declension'"/>
            <xsl:with-param name="context-suffix" select="$context-suffix"/>
          </xsl:call-template>
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="item-plus-text-plus-context">
            <xsl:with-param name="item" select="."/>
            <xsl:with-param name="name" select="'decl'"/>
            <xsl:with-param name="suffix" select="' declension'"/>
            <xsl:with-param name="context-suffix" select="$context-suffix"/>
          </xsl:call-template>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:for-each>
  </xsl:template>

  <!-- item plus leading/trailing text -->
  <!-- use name of item as class -->
  <!-- use value of item as context, if requested -->
  <xsl:template name="item-plus-text-plus-context">
    <xsl:param name="item"/>
    <xsl:param name="name"/>
    <xsl:param name="prefix" select="''"/>
    <xsl:param name="suffix" select="''"/>
    <xsl:param name="context-prefix" select="''"/>
    <xsl:param name="context-suffix" select="''"/>
    <xsl:for-each select="$item">
      <xsl:variable name="item-name">
        <xsl:choose>
          <xsl:when test="$name">
            <xsl:value-of select="$name"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="name(.)"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:variable>
      <xsl:variable name="item-context">
        <xsl:value-of select="concat($context-prefix, ., $context-suffix)"/>
      </xsl:variable>
      <span class="alph-{$item-name}"
            context="{translate($item-context,' ','_')}">
        <xsl:value-of select="$prefix"/>
        <xsl:value-of select="."/>
        <xsl:value-of select="$suffix"/>
      </span>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="item-plus-text">
    <xsl:param name="item"/>
    <xsl:param name="name"/>
    <xsl:param name="prefix" select="''"/>
    <xsl:param name="suffix" select="''"/>
    <xsl:param name="strip-sense" select="false()"/>
    <xsl:for-each select="$item">
      <xsl:variable name="item-name">
        <xsl:choose>
          <xsl:when test="$name">
            <xsl:value-of select="$name"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="name(.)"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:variable>
      <span class="alph-{$item-name}">
        <xsl:value-of select="$prefix"/>
        <xsl:call-template name="convert-text">
          <xsl:with-param name="item" select="."/>
          <xsl:with-param name="strip-sense" select="$strip-sense"/>
        </xsl:call-template>
        <xsl:value-of select="$suffix"/>
      </span>
    </xsl:for-each>
  </xsl:template>

  <!-- convert text if necessary -->
  <xsl:template name="convert-text">
    <xsl:param name="item"/>
    <xsl:param name="partial" select="false()"/>
    <xsl:param name="strip-sense" select="false()"/>

    <xsl:variable name="text">
      <!-- switch on language -->
      <xsl:choose>
        <!-- ancient Greek -->
        <xsl:when test="starts-with($item/ancestor-or-self::*/@xml:lang, 'grc')">
          <!-- is this betacode? -->
          <xsl:variable name="isbeta">
            <xsl:call-template name="is-beta">
              <xsl:with-param name="input" select="$item"/>
            </xsl:call-template>
          </xsl:variable>

          <!-- get text in Unicode -->
          <xsl:choose>
            <!-- if betacode -->
            <xsl:when test="$isbeta > 0">
              <xsl:variable name="item-text">
                <xsl:choose>
                  <xsl:when test="$item/*">
                    <xsl:for-each select="$item/*">
                      <xsl:value-of select="./text()"/>
                    </xsl:for-each>
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:value-of select="$item/text()"/>
                  </xsl:otherwise>
                </xsl:choose>
              </xsl:variable>
              <!-- convert it to unicode -->
              <xsl:call-template name="beta-to-uni">
                <xsl:with-param name="input" select="$item-text"/>
                <xsl:with-param name="partial" select="$partial"/>
              </xsl:call-template>
            </xsl:when>
            <xsl:otherwise>
              <xsl:value-of select="$item"/>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:when>

        <!-- other language, do nothing -->
        <xsl:otherwise>
          <xsl:value-of select="$item"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <!-- strip sense indication if requested -->
    <xsl:choose>
      <xsl:when test="$strip-sense">
        <xsl:call-template name="strip-trailing">
          <xsl:with-param name="input" select="$text"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$text"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- strip trailing characters from input -->
  <!-- default is to strip trailing digits -->
  <xsl:template name="strip-trailing">
    <xsl:param name="input"/>
    <xsl:param name="to-strip" select="'0123456789'"/>

    <xsl:variable name="last-char"
      select="substring($input, string-length($input))"/>

    <xsl:choose>
      <!-- if empty input or last character is not in list -->
      <xsl:when test="translate($last-char, $to-strip, '') = $last-char">
        <!-- we're done - return input -->
        <xsl:value-of select="$input"/>
      </xsl:when>
      <!-- if last character is in list -->
      <xsl:otherwise>
        <!-- drop it and strip remaining (leading) part -->
        <xsl:call-template name="strip-trailing">
          <xsl:with-param name="input"
            select="substring($input, 1, string-length($input) - 1)"/>
          <xsl:with-param name="to-strip" select="$to-strip"/>
        </xsl:call-template>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

</xsl:stylesheet>
