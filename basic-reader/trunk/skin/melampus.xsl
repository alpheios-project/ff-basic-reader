<?xml version="1.0" encoding="UTF-8"?>

<!--
    Stylesheet for transforming lexicon output to HTML
-->

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" exclude-result-prefixes="xs">

    <xsl:template match="/">
        <html>
            <head>
                <link rel="stylesheet" type="text/css" href="melampus.css"/>
            </head>
            <body>
                <div id="mp-text">
                    <xsl:apply-templates select="//word|//error|//unknown"/>
                </div>
            </body>
        </html>
    </xsl:template>

    <xsl:template match="word">
        <div class="mp-word">
            <!-- sort entries by decreasing frequency of occurrence -->
            <!-- and then by part of speech -->
            <!-- arbitrarily choosing the first in the rare case where multiple dict elements exist -->
            <xsl:for-each select="entry">
                <xsl:sort select="dict[1]/freq/@order" data-type="number" order="descending"/>
                <xsl:sort select="dict[1]/pofs/@order" data-type="number" order="descending"/>

                <div class="mp-entry">

                    <!-- process dictionary info and meanings -->
                    <xsl:for-each select="dict|mean">
                        <xsl:apply-templates select="."/>
                    </xsl:for-each>

                    <!-- process inflected forms -->
                    <xsl:for-each select="infl">
                        <xsl:sort select="term/stem"/>
                        <xsl:sort select="pofs/@order" data-type="number" order="descending"/>
                        <xsl:variable name="last-stem" select="term/stem"/>
                        <xsl:variable name="last-pofs" select="pofs"/>
                        <!-- if this is a form we haven't seen yet -->
                        <xsl:if
                            test="not(preceding-sibling::infl[(term/stem=$last-stem) and
                                                              (pofs=$last-pofs)])">
                            <!-- process all inflections having this form (stem and part-of-speech) -->
                            <xsl:call-template name="inflection-set">
                                <xsl:with-param name="inflections"
                                    select="../infl[(term/stem=$last-stem) and
                                                     (pofs=$last-pofs)]"
                                />
                            </xsl:call-template>
                        </xsl:if>
                    </xsl:for-each>
                    <!-- handle any forms that have no stem -->
                    <xsl:call-template name="inflection-set">
                        <xsl:with-param name="inflections"
                            select="infl[not(term/stem) or not(pofs)]"/>
                    </xsl:call-template>

                </div>
            </xsl:for-each>
            <!-- end for each entry -->
        </div>
    </xsl:template>
    <!-- end match word -->

    <xsl:template match="unknown">
        <div class="mp-unknown">
            <xsl:text>Unknown: </xsl:text>
            <span class="mp-hdwd">
                <xsl:value-of select="."/>
            </span>
        </div>
    </xsl:template>

    <xsl:template match="error">
        <div class="mp-error">
            <xsl:text>Error: </xsl:text>
            <span class="mp-hdwd">
                <xsl:value-of select="."/>
            </span>
        </div>
    </xsl:template>

    <xsl:template match="dict">
        <div class="mp-dict">
            <!-- define order in which elements should appear -->
            <xsl:call-template name="item-plus-text">
                <xsl:with-param name="item" select="hdwd"/>
                <xsl:with-param name="suffix" select="': '"/>
            </xsl:call-template>
            <xsl:call-template name="item-plus-text">
                <xsl:with-param name="item" select="pron"/>
                <xsl:with-param name="prefix" select="'['"/>
                <xsl:with-param name="suffix" select="'] '"/>
            </xsl:call-template>
            
            <!-- Note:  Only one of case, gender, or kind can appear, depending on part of speech,
            therefore we can pass all through a single parameter -->
            <xsl:call-template name="part-of-speech">
                <xsl:with-param name="attr" select="case|gend|kind"/>
                <xsl:with-param name="pofs" select="pofs"/>
            </xsl:call-template>
            <xsl:call-template name="item-plus-text-plus-context">
                <xsl:with-param name="item" select="decl"/>
                <xsl:with-param name="suffix" select="' declension'"/>
            </xsl:call-template>
            <xsl:call-template name="item-plus-text-plus-context">
                <xsl:with-param name="item" select="conj"/>
                <xsl:with-param name="suffix" select="' conjugation'"/>
            </xsl:call-template>
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
        </div>
    </xsl:template>

    <xsl:template match="mean">
        <div class="mp-mean">
            <xsl:value-of select="."/>
        </div>
    </xsl:template>

    <xsl:template name="part-of-speech">
        <xsl:param name="attr"/>
        <xsl:param name="pofs"/>

        <xsl:if test="$attr|$pofs">
            <span class="mp-pofs" context="{translate($pofs,' ','_')}">
                <xsl:choose>
                    <!-- say "verb taking <x>" rather than "taking <x> verb" -->
                    <xsl:when test="starts-with($attr,'taking ')">
                        <xsl:value-of select="$pofs"/>
                        <xsl:text> </xsl:text>
                        <span class="mp-attr">
                            <xsl:value-of select="$attr"/>
                        </span>
                    </xsl:when>
                    <xsl:otherwise>
                        <!-- all other attributes come before part of speech-->
                        <xsl:if test="$attr">
                            <span class="mp-attr">
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
            <xsl:choose>
                <!-- if context supplied, add it to span -->
                <xsl:when test="$span-context">
                    <span class="mp-{$span-name}" context="{translate($span-context,' ','_')}">
                        <xsl:text>(</xsl:text>
                        <xsl:for-each select="$items">
                            <xsl:if test="position() != 1">, </xsl:if>
                            <xsl:value-of select="."/>
                        </xsl:for-each>
                        <xsl:text>)</xsl:text>
                    </span>
                </xsl:when>
                <!-- if no context supplied -->
                <xsl:otherwise>
                    <span class="mp-{$span-name}">
                        <xsl:text>(</xsl:text>
                        <xsl:for-each select="$items">
                            <xsl:if test="position() != 1">, </xsl:if>
                            <xsl:value-of select="."/>
                        </xsl:for-each>
                        <xsl:text>)</xsl:text>
                    </span>
                </xsl:otherwise>
            </xsl:choose>

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
            <div class="mp-infl-set">
                <xsl:apply-templates select="$inflections[1]/term"/>
                <xsl:if test="$inflections[1]/pofs != $inflections[1]/../dict[1]/pofs">
                    <xsl:call-template name="parenthesize">
                        <xsl:with-param name="items" select="$inflections[1]/pofs"/>
                        <xsl:with-param name="span-name">pofs</xsl:with-param>
                        <xsl:with-param name="span-context" select="$inflections[1]/pofs"/>
                    </xsl:call-template>
                </xsl:if>

                <!-- decide how to display form based on structure -->
                <xsl:choose>
                    <!-- if inflections have case -->
                    <xsl:when test="$inflections/case">
                        <!-- process singular case list -->
                        <xsl:if test="count($inflections[num = 'singular']/case)">
                            <div class="mp-infl">
                                <xsl:text>Singular: </xsl:text>
                                <xsl:for-each select="$inflections[num = 'singular']/case">
                                    <xsl:sort select="./@order" data-type="number"
                                        order="descending"/>
                                    <xsl:apply-templates select="."/>
                                </xsl:for-each>
                            </div>
                        </xsl:if>

                        <!-- process plural case list -->
                        <xsl:if test="count($inflections[num = 'plural']/case)">
                            <div class="mp-infl">
                                <xsl:text>Plural: </xsl:text>
                                <xsl:for-each select="$inflections[num = 'plural']/case">
                                    <xsl:sort select="./@order" data-type="number"
                                        order="descending"/>
                                    <xsl:apply-templates select="."/>
                                </xsl:for-each>
                            </div>
                        </xsl:if>

                        <!-- process other case list -->
                        <xsl:if test="count($inflections[count(current()/num)=0]/case)">
                            <div class="mp-infl">
                                <xsl:text>Case: </xsl:text>
                                <xsl:for-each select="$inflections[count(current()/num)=0]/case">
                                    <xsl:sort select="./@order" data-type="number"
                                        order="descending"/>
                                    <xsl:apply-templates select="."/>
                                </xsl:for-each>
                            </div>
                        </xsl:if>
                    </xsl:when>
                    <!-- end when inflection has case -->

                    <!-- verb inflection -->
                    <xsl:when test="$inflections/tense">
                        <xsl:for-each select="$inflections[tense]">
                            <div class="mp-infl">
                                <xsl:call-template name="item-plus-text-plus-context">
                                    <xsl:with-param name="item" select="pers"/>
                                    <xsl:with-param name="suffix" select="' person'"/>
                                </xsl:call-template>
                                <xsl:call-template name="item-plus-text-plus-context">
                                    <xsl:with-param name="item" select="num"/>
                                    <xsl:with-param name="suffix" select="';'"/>
                                </xsl:call-template>
                                <xsl:apply-templates select="tense"/>
                                <xsl:call-template name="item-plus-text-plus-context">
                                    <xsl:with-param name="item" select="mood"/>
                                    <xsl:with-param name="suffix" select="';'"/>
                                </xsl:call-template>
                                <xsl:apply-templates select="voice"/>
                            </div>
                        </xsl:for-each>
                    </xsl:when>
                    <!-- end verb inflection -->

                    <!-- adverb inflection -->
                    <xsl:when test="$inflections[1]/pofs = 'adverb'">
                        <div class="mp-infl">
                            <xsl:apply-templates select="comp"/>
                        </div>
                    </xsl:when>
                    <!-- end adverb inflection -->
                </xsl:choose>
            </div>
        </xsl:if>
    </xsl:template>

    <xsl:template match="term">
        <span class="mp-term">
            <xsl:value-of select="stem"/>
            <xsl:if test="suff">
                <xsl:text>&#8226;</xsl:text>
            </xsl:if>
            <span class="mp-suff">
                <xsl:value-of select="suff"/>
            </span>
        </span>
    </xsl:template>

    <!--  Templates to handle simple text elements -->
    <xsl:template match="*">
        <span class="mp-{name(.)}">
            <xsl:value-of select="."/>
        </span>
    </xsl:template>

    <xsl:template match="case">
        <xsl:variable name="context">
            <xsl:value-of select="."/>
            <xsl:text>-</xsl:text>
            <xsl:value-of select="../num"/>
            <xsl:text>-</xsl:text>
            <xsl:value-of select="../gend"/>
            <xsl:text>-</xsl:text>
            <xsl:value-of select="../pofs"/>
        </xsl:variable>
        <span class="mp-case" context="{translate($context,' ','_')}">
            <xsl:value-of select="."/>
            <xsl:if
                test="(../pofs='pronoun' or
                           ../pofs='adjective' or
                           ../pofs='supine' or
                           ../pofs='verb participle') and ../gend">
                <xsl:variable name="gend" select="../gend"/>
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

    <!-- item plus leading/trailing text -->
    <!-- use name of item as class -->
    <!-- use value of item as context, if requested -->
    <xsl:template name="item-plus-text-plus-context">
        <xsl:param name="item"/>
        <xsl:param name="prefix" select="''"/>
        <xsl:param name="suffix" select="''"/>
        <xsl:for-each select="$item">
            <span class="mp-{name(.)}" context="{translate(.,' ','_')}">
                <xsl:value-of select="$prefix"/>
                <xsl:value-of select="."/>
                <xsl:value-of select="$suffix"/>
            </span>
        </xsl:for-each>
    </xsl:template>

    <xsl:template name="item-plus-text">
        <xsl:param name="item"/>
        <xsl:param name="prefix" select="''"/>
        <xsl:param name="suffix" select="''"/>
        <xsl:for-each select="$item">
            <span class="mp-{name(.)}">
                <xsl:value-of select="$prefix"/>
                <xsl:value-of select="."/>
                <xsl:value-of select="$suffix"/>
            </span>
        </xsl:for-each>
    </xsl:template>

</xsl:stylesheet>
