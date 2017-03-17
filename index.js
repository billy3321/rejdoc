/* *********************************************
 * @license
 * Copyright (c) 2017-Present lisez <mm4324@gmail.com>
 * All rights reserved. This code is governed by a BSD-style license
 * that can be found in the LICENSE file.
 * version: 2.0.1-alpha
 ***********************************************/

/***************************************
 * Re-layout ROC Judicial doc to easy reuse style.
 * @params {String} input - the content of judicial doc
 ***************************************/
function getReJDocString(input) {
    if (input == null) {
        return false;
    }

    // regexp
    // Content Columns
    var regexASCIITable = /[\u2500-\u257F]/,
        regexNavText    = /共\d+\s?筆|現在第\d+\s?筆|[第上下一最末]{2}[筆頁]|友善列印|匯出PDF|對於本系統功能有任何建議|有加底線者為可點選之項目|無格式複製|請給予我們建議|^請點這裡並輸入你的[名字\w]+|Olark|留下你的建議|^搜尋$|^登入$|^送出$|分享至[\w\s]+|排版圖示/,

        regexMetaColumns = /^【?(裁判[字號日期案由全內文]+|會議次別|決議日期|資料來源|相關法條|決議|討論事項|提案|歷審裁判|解釋[字號日期爭點文理由]+)：?】?([^】：]+)$/,
        regexBodyColumns = /^[主文理由犯罪事實及\s]{2,}\n/gim,
        regexLawArticle  = /第[\d、\-]+條[(（][^)）]+$/,
        regexFormalDate  = /^[中華民國年月日\s\d]+$/gim,

        regexCaseName   = /^(([司法最高臺灣北中高雄福建智慧公務員]{2,}[^一二三四五六七八九十\u25CB\d]+[裁判定決]+)([一二三四五六七八九十\u25CB\d]+年度.+字第[一二三四五六七八九十\u25CB\d]+號[裁判定決]*))$/,
        regexCaseCourt  = /^([司法最高臺灣北中高雄福建智慧公務員]{2,}[^一二三四五六七八九十\u25CB\d]+[裁判定決]+)/,
        regexCaseNumber = /([一二三四五六七八九十\u25CB\d]+年度.+字第[一二三四五六七八九十\u25CB\d]+號[裁判定決]*)/,

        // 被告ＯＯＯ
        regexParities   = /^([先後]?訴?[原被]告|移送機關|被付懲戒人|訴願人|聲請覆審人|聲請人|相對人|再?抗告人|被?上訴人|(輔助)?參加人|債[務權]人|公訴\d*人|受刑人)(.+)$/,
        regexAttorney   = /^([原審指定選任]*辯護人|[法定訴訟複]*[代理表]+人|輔助人)(.+)$/,
        regexNotParties = /^(?:兼?上列[一二三四五六七八九十\u25CB\d]+人|共同)$/,

        // 上列ＯＯ因ＯＯ案件⋯⋯本院ＯＯ如下：
        regexSummray = /^上列.+[事案]件/,

        // 審判長法官ＯＯ、法官ＯＯＯ、書記官ＯＯＯ、法院書記官ＯＯＯ
        regexOfficeChief = /^([^庭]+庭)([審判長法官]+.+)$/,
        regexOffice      = /^(.+庭)$/,
        regexOfficials   = /^([審判長]*法官|[法院]*書記官)(.+)$/,

        // Marks
        regexNumber     = /\d+/,
        regexBlankMarks = /\s+|　/g,
        regexFootMarks  = /[。：！？]\n/gim,
        regexAllMarks   = /[，。、！？「」（）()『』]+/,
        regexOpenMarks  = /[「（(『]/,
        regexCloseMarks = /[」）)』]/,
        regexEndDot     = /。\n/gim,
        regexFootDot    = /。$/;


    // Object store
    this.rawData = input.split(regexBodyColumns),
    this.rawDataLength = this.rawData.length,
    this.rawColumns = input.match(regexBodyColumns),
    this.caseContent = {
        'court':         [],
        'court_div':     [],
        'court_member':  [],
        'case_number':   [],
        'case_meta':     [],
        'case_parities': [],
        'case_history':  [],
        // 'case_relatives' : [],
        // 'case_articles'  : [],
        'fulltext': []
    },
    this.caseFullOpt = [],

    // Case structor
    this.caseHead = this.rawData[0].split('\n'),
    this.caseHeadLength = this.caseHead.length,
    this.caseMain = this.rawData[1].split(regexEndDot).filter(function(el) {
        return el != '';
    }),
    this.caseMainLength = this.caseMain.length,
    this.caseBody = this.rawData.splice(2).join('\n'),
    this.caseBodyDate = this.caseBody.match(regexFormalDate),
    this.caseBodyColumns = this.caseBody.split(regexFormalDate),
    this.caseBodyReason = this.caseBodyColumns[0].split(regexFootMarks).filter(function(el) {
        return el != '';
    }),
    this.caseBodyReasonSplit = this.caseBodyColumns[0].match(regexFootMarks),
    this.caseBodyReasonLength = this.caseBodyReason.length;
    var caseFooterFun = function(_content, _column) {
        var _ary    = _content.splice(1),
            _len    = _ary.length,
            _result = [];

        for (var index = 0; index < _len; index++) {
            _result.push(_column[index]);
            _result.push(_ary[index]);
        }

        return _result.join('\n').split('\n');
    };
    this.caseFooter = caseFooterFun(this.caseBodyColumns, this.caseBodyDate),
    this.caseFooterLength = this.caseFooter.length;

    // Case Header

    var casePartyGroup = -1;
    var caseParyDesc   = [];

    for (var caseHeadIndex = 0; caseHeadIndex < this.caseHeadLength; caseHeadIndex++) {

        var _term = this.caseHead[caseHeadIndex].replace(regexBlankMarks, '');

        // ex. 友善列印
        if (regexNavText.test(_term)) {
            continue;
        }

        // if it detects '上列ＯＯ因ＯＯ案件⋯⋯本院ＯＯ如下：' that means the end of head column.
        if (regexSummray.test(_term)) {
            this.caseContent['fulltext'].push(this.caseHead.splice(caseHeadIndex).join('').replace(regexBlankMarks, ''));
            break;
        } else {
            // ex. ＯＯＯ法院ＯＯ判決(裁定)000年度ＯＯ字第00號
            if (regexCaseName.test(_term)) {
                var _temp = _term.match(regexCaseName);
                this.caseContent['court'] = _temp[2];
                this.caseContent['case_number'].push(_temp[3]);
            } else {
                // ex. ＯＯＯ法院ＯＯ判決(裁定)
                if (regexCaseCourt.test(_term)) {
                    this.caseContent['court'] = _term;
                }
                // ex. 000年度ＯＯ字第00號
                if (regexCaseNumber.test(_term)) {
                    this.caseContent['case_number'].push(_term);
                }
            }

            // ex. 【裁判字號】 000,A,00
            if (regexMetaColumns.test(_term)) {
                var _temp = _term.match(regexMetaColumns);
                this.caseContent['case_meta'].push([_temp[1], _temp[2]]);
            }

            // ex. 被告ＯＯＯ
            if (regexParities.test(_term)) {
                var _temp     = _term.match(regexParities),
                    lastParty = _temp[1];
                casePartyGroup += 1;
                if (typeof this.caseContent['case_parities'][casePartyGroup] === 'undefined') {
                    this.caseContent['case_parities'][casePartyGroup] = [];
                }
                this.caseContent['case_parities'][casePartyGroup].push(_term);
            } else if (regexAttorney.test(_term)) {
                var _temp     = _term.match(regexAttorney),
                    lastParty = _temp[1];
                this.caseContent['case_parities'][casePartyGroup].push(_term);
            } else if (regexAllMarks.test(_term)) {
                // ex.（現於臺灣ＯＯ監獄執行中，
                if (regexOpenMarks.test(_term)) {
                    caseParyDesc.push(_term);
                    _term = '';
                }
                // ex. 暫寄押臺灣ＯＯ監獄）
                if (regexCloseMarks.test(_term)) {
                    caseParyDesc.push(_term);
                    _term = caseParyDesc.join('');
                    this.caseContent['case_parities'][casePartyGroup][this.caseContent['case_parities'][casePartyGroup].length - 1] += _term;
                    caseParyDesc = [];
                }

            } else if (lastParty != null && lastParty != _term && !regexNotParties.test(_term)) {
                this.caseContent['case_parities'][casePartyGroup].push(lastParty + _term);
            }

            this.caseContent['fulltext'].push(_term);
        }

    }

    // Case Main Part

    this.caseContent['fulltext'].push(this.rawColumns[0].replace(regexBlankMarks, ''));
    for (var caseMainIndex = 0; caseMainIndex < this.caseMainLength; caseMainIndex++) {
        var _term = this.caseMain[caseMainIndex].replace(regexBlankMarks, '');
        this.caseContent['fulltext'].push(_term + '。');
    }

    // Case Grounds of decision

    this.caseContent['fulltext'].push(this.rawColumns[1].replace(regexBlankMarks, ''));
    for (var reasonIndex = 0; reasonIndex < this.caseBodyReasonLength; reasonIndex++) {
        var _term = this.caseBodyReason[reasonIndex].replace(regexBlankMarks, '');
        this.caseContent['fulltext'].push(_term + this.caseBodyReasonSplit[reasonIndex]);
    }

    // Case Footer

    var storeParagraph = [];

    for (var footerIndex = 0; footerIndex < this.caseFooterLength; footerIndex++) {

        // avoid ASCII tables
        if (regexASCIITable.test(this.caseFooter[footerIndex])) {
            this.caseContent['fulltext'].push(this.caseFooter[footerIndex]);
            continue;
        }

        // replace all blanks
        var _term = this.caseFooter[footerIndex].replace(regexBlankMarks, '');

        // blank line
        if (_term == '') {
            continue;
        }

        // if the paragraph have marks
        if (regexAllMarks.test(_term) || regexNumber.test(_term)) {

            // ex. ＯＯＯ第00條(yyy/mm/dd) || ＯＯＯ第271條（殺人罪）
            if (regexLawArticle.test(_term)) {
                this.caseContent['fulltext'].push(_term);
                continue;
            }

            // if it has a dot in the end
            if (regexFootDot.test(_term)) {
                storeParagraph.push(_term);
                var _end = storeParagraph.join('');
                this.caseContent['fulltext'].push(_end);
                storeParagraph = [];
                continue;
            } else {
                storeParagraph.push(_term);
                continue;
            }

        } else {
            // 中華民國yy年mm月dd日
            if (regexFormalDate.test(_term)) {
                this.caseContent['fulltext'].push(_term);
                continue;
            }

            // exclude: 法官或檢察官執行本法而有法官法第30條第2項或第89條            
            if (!regexNumber.test(_term)) {
                // ＯＯ第ＯＯ庭審判長法官ＯＯＯ
                if (regexOfficeChief.test(_term)) {
                    var _temp = _term.match(regexOfficeChief);
                    this.caseContent['court_div'] = _temp[1];
                    this.caseContent['court_member'].push(_temp[2]);
                    this.caseContent['fulltext'].push(_term);
                    continue;
                } else {
                    if (regexOffice.test(_term)) {
                        this.caseContent['court_div'] = _term;
                    }
                    if (regexOfficials.test(_term)) {
                        this.caseContent['court_member'].push(_term);
                    }
                    this.caseContent['fulltext'].push(_term);
                    continue;
                }
            }
        }

    }

    // console.log(this.caseContent);
    return true;
}

getReJDocString.prototype.getText = function() {
    var isWin           = navigator.platform.toUpperCase().indexOf('WIN') > -1 ? true : false,
        regexBreakMarks = /^[\n\r]+/gim,
        regexLineBreak  = /\n|\r/gm,
        _output         = this.caseContent['fulltext'].join('\n').replace(regexBreakMarks, '');

    if (isWin) {
        _output = _output.replace(regexLineBreak, '\n\r');
    }
    return _output;
};

getReJDocString.prototype.getJSON = function() {
    return JSON.stringify(this.caseContent);
};

module.exports = getReJDocString;