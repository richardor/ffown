﻿/**
* jQuery ligerUI 1.1.5
* 
* Author leoxie [ gd_star@163.com ] 
* 
*/
(function ($)
{
    $.fn.ligerTree = function (options)
    {
        return $.ligerui.run.call(this, "ligerTree", arguments);
    };

    $.fn.ligerGetTreeManager = function ()
    {
        return $.ligerui.run.call(this, "ligerGetTreeManager", arguments);
    };

    $.ligerDefaults.Tree = {
        url: null,
        data: null,
        checkbox: true,
        autoCheckboxEven: true,
        parentIcon: 'folder',
        childIcon: 'leaf',
        textFieldName: 'text',
        attribute: ['id', 'url'],
        treeLine: true,            //是否显示line
        nodeWidth: 90,
        statusName: '__status',
        isLeaf: null,              //是否子节点的判断函数
        single: false,               //是否单选
        onBeforeExpand: function () { },
        onContextmenu: function () { },
        onExpand: function () { },
        onBeforeCollapse: function () { },
        onCollapse: function () { },
        onBeforeSelect: function () { },
        onSelect: function () { },
        onBeforeCancelSelect: function () { },
        onCancelselect: function () { },
        onCheck: function () { },
        onSuccess: function () { },
        onError: function () { },
        onClick: function () { },
        idFieldName: 'id',
        parentIDFieldName: null,
        topParentIDValue: 0,
        onBeforeAppend: function () { },        //加载数据前事件，可以通过return false取消操作
        onAppend: function () { },             //加载数据时事件，对数据进行预处理以后
        onAfterAppend: function () { },         //加载数据完事件
        slide: true           //是否以动画的形式显示
    };

    $.ligerui.controls.Tree = function (element, options)
    {
        $.ligerui.controls.Tree.base.constructor.call(this, element, options);
    };

    $.ligerui.controls.Tree.ligerExtend($.ligerui.core.UIComponent, {
        _init: function ()
        {
            $.ligerui.controls.Tree.base._init.call(this);
            var g = this, p = this.options;
            if (p.single) p.autoCheckboxEven = false;
        },
        _render: function ()
        { 
            var g = this, p = this.options; 
            g.set(p,true); 
            g.tree = $(g.element);
            g.tree.addClass('l-tree');
            g.sysAttribute = ['isexpand', 'ischecked', 'href', 'style'];
            g.loading = $("<div class='l-tree-loading'></div>");
            g.tree.after(g.loading);
            g.data = [];
            g.maxOutlineLevel = 1;
            g.treedataindex = 0;
            g._applyTree();
            g._setTreeEven();

            g.set(p, false);
        },
        _setTreeLine: function (value)
        {
            if (value) this.tree.removeClass("l-tree-noline");
            else this.tree.addClass("l-tree-noline");
        },
        _setUrl: function (url)
        {
            if (url) this.loadData(null, url);
        },
        _setData: function (data)
        {
            if (data) this.append(null, data);
        },
        setData: function (data)
        {
            this.set('data', data);
        },
        getData: function ()
        {
            return this.data;
        },
        //是否包含子节点
        hasChildren: function (treenodedata)
        {
            if (this.options.isLeaf) return this.options.isLeaf(treenodedata);
            return treenodedata.children ? true : false;
        },
        //获取父节点
        getParentTreeItem: function (treenode, level)
        {
            var treeitem = $(treenode);
            if (treeitem.parent().hasClass("l-tree"))
                return null;
            if (level == undefined)
            {
                if (treeitem.parent().parent("li").length == 0)
                    return null;
                return treeitem.parent().parent("li")[0];
            }
            var currentLevel = parseInt(treeitem.attr("outlinelevel"));
            var currenttreeitem = treeitem;
            for (var i = currentLevel - 1; i >= level; i--)
            {
                currenttreeitem = currenttreeitem.parent().parent("li");
            }
            return currenttreeitem[0];
        },
        getChecked: function ()
        {
            var g = this, p = this.options;
            if (!this.options.checkbox) return null;
            var nodes = [];
            $(".l-checkbox-checked", g.tree).parent().parent("li").each(function ()
            {
                var treedataindex = parseInt($(this).attr("treedataindex"));
                nodes.push({ target: this, data: g._getDataNodeByTreeDataIndex(g.data, treedataindex) });
            });
            return nodes;
        },
        getSelected: function ()
        {
            var g = this, p = this.options;
            var node = {};
            node.target = $(".l-selected", g.tree).parent("li")[0];
            if (node.target)
            {
                var treedataindex = parseInt($(node.target).attr("treedataindex"));
                node.data = g._getDataNodeByTreeDataIndex(g.data, treedataindex);
                return node;
            }
            return null;
        },
        //升级为父节点级别
        upgrade: function (treeNode)
        {
            var g = this, p = this.options;
            $(".l-note", treeNode).each(function ()
            {
                $(this).removeClass("l-note").addClass("l-expandable-open");
            });
            $(".l-note-last", treeNode).each(function ()
            {
                $(this).removeClass("l-note-last").addClass("l-expandable-open");
            });
            $("." + g._getChildNodeClassName(), treeNode).each(function ()
            {
                $(this)
                        .removeClass(g._getChildNodeClassName())
                        .addClass(g._getParentNodeClassName(true));
            });
        },
        //降级为叶节点级别
        demotion: function (treeNode)
        {
            var g = this, p = this.options;
            if (!treeNode && treeNode[0].tagName.toLowerCase() != 'li') return;
            var islast = $(treeNode).hasClass("l-last");
            $(".l-expandable-open", treeNode).each(function ()
            {
                $(this).removeClass("l-expandable-open")
                        .addClass(islast ? "l-note-last" : "l-note");
            });
            $(".l-expandable-close", treeNode).each(function ()
            {
                $(this).removeClass("l-expandable-close")
                        .addClass(islast ? "l-note-last" : "l-note");
            });
            $("." + g._getParentNodeClassName(true), treeNode).each(function ()
            {
                $(this)
                        .removeClass(g._getParentNodeClassName(true))
                        .addClass(g._getChildNodeClassName());
            });
        },
        collapseAll: function ()
        {
            var g = this, p = this.options;
            $(".l-expandable-open", g.tree).click();
        },
        expandAll: function ()
        {
            var g = this, p = this.options;
            $(".l-expandable-close", g.tree).click();
        },
        loadData: function (node, url, param)
        {
            var g = this, p = this.options;
            g.loading.show();
            var ajaxtype = param ? "post" : "get";
            param = param || [];
            //请求服务器
            $.ajax({
                type: ajaxtype,
                url: url,
                data: param,
                dataType: 'json',
                success: function (data)
                {
                    if (!data) return;
                    g.loading.hide();
                    g.append(node, data);
                    g.trigger('success', [data]);
                },
                error: function (XMLHttpRequest, textStatus, errorThrown)
                {
                    try
                    {
                        g.loading.hide();
                        g.trigger('error', [XMLHttpRequest, textStatus, errorThrown]);
                    }
                    catch (e)
                    {

                    }
                }
            });
        },
        //清空
        clear: function ()
        {
            var g = this, p = this.options;
            //g.tree.html("");
            $("> li", g.tree).each(function () { g.remove(this); });
        },
        remove: function (treeNode)
        {
            var g = this, p = this.options;
            var treedataindex = parseInt($(treeNode).attr("treedataindex"));
            var treenodedata = g._getDataNodeByTreeDataIndex(g.data, treedataindex);
            if (treenodedata) g._setTreeDataStatus([treenodedata], 'delete');
            var parentNode = g.getParentTreeItem(treeNode);
            //复选框处理
            if (p.checkbox)
            {
                $(".l-checkbox", treeNode).remove();
                g._setParentCheckboxStatus($(treeNode));
            }
            $(treeNode).remove();
            if (parentNode == null) //代表顶级节点
            {
                parentNode = g.tree.parent();
            }
            //set parent
            var treeitemlength = $("> ul > li", parentNode).length;
            if (treeitemlength > 0)
            {
                //遍历设置子节点
                $("> ul > li", parentNode).each(function (i, item)
                {
                    if (i == 0 && !$(this).hasClass("l-first"))
                        $(this).addClass("l-first");
                    if (i == treeitemlength - 1 && !$(this).hasClass("l-last"))
                        $(this).addClass("l-last");
                    if (i == 0 && i == treeitemlength - 1 && !$(this).hasClass("l-onlychild"))
                        $(this).addClass("l-onlychild");
                    $("> div .l-note,> div .l-note-last", this)
                           .removeClass("l-note l-note-last")
                           .addClass(i == treeitemlength - 1 ? "l-note-last" : "l-note");
                    g._setTreeItem(this, { isLast: i == treeitemlength - 1 });
                });
            }

        },
        update: function (domnode, newnodedata)
        {
            var g = this, p = this.options;
            var treedataindex = parseInt($(domnode).attr("treedataindex"));
            nodedata = g._getDataNodeByTreeDataIndex(g.data, treedataindex);
            for (var attr in newnodedata)
            {
                nodedata[attr] = newnodedata[attr];
                if (attr == p.textFieldName)
                {
                    $("> .l-body > span", domnode).text(newnodedata[attr]);
                }
            }
        },
        //增加节点集合
        append: function (parentNode, newdata)
        {
            var g = this, p = this.options;
            if (g.trigger('beforeAppend', [parentNode, newdata]) == false) return false;
            if (!newdata || !newdata.length) return false;
            if (p.idFieldName && p.parentIDFieldName)
                newdata = g.arrayToTree(newdata, p.idFieldName, p.parentIDFieldName);
            g._addTreeDataIndexToData(newdata);
            g._setTreeDataStatus(newdata, 'add');

            g.trigger('append', [parentNode, newdata])
            g._appendData(parentNode, newdata);
            if (!parentNode)//增加到根节点
            {
                //remove last node class
                if ($("> li:last", g.tree).length > 0)
                    g._setTreeItem($("> li:last", g.tree)[0], { isLast: false });

                var gridhtmlarr = g._getTreeHTMLByData(newdata, 1, [], true);
                gridhtmlarr[gridhtmlarr.length - 1] = gridhtmlarr[0] = "";
                g.tree.append(gridhtmlarr.join(''));

                $(".l-body", g.tree).hover(function ()
                {
                    $(this).addClass("l-over");
                }, function ()
                {
                    $(this).removeClass("l-over");
                });

                g._upadteTreeWidth();
                g.trigger('afterAppend', [parentNode, newdata])
                return;
            }
            var treeitem = $(parentNode);
            var outlineLevel = parseInt(treeitem.attr("outlinelevel"));

            var hasChildren = $("> ul", treeitem).length > 0;
            if (!hasChildren)
            {
                treeitem.append("<ul class='l-children'></ul>");
                //设置为父节点
                g.upgrade(parentNode);
            }
            //remove last node class  
            if ($("> .l-children > li:last", treeitem).length > 0)
                g._setTreeItem($("> .l-children > li:last", treeitem)[0], { isLast: false });

            var isLast = [];
            for (var i = 1; i <= outlineLevel - 1; i++)
            {
                var currentParentTreeItem = $(g.getParentTreeItem(parentNode, i));
                isLast.push(currentParentTreeItem.hasClass("l-last"));
            }
            isLast.push(treeitem.hasClass("l-last"));
            var gridhtmlarr = g._getTreeHTMLByData(newdata, outlineLevel + 1, isLast, true);
            gridhtmlarr[gridhtmlarr.length - 1] = gridhtmlarr[0] = "";
            $(">.l-children", parentNode).append(gridhtmlarr.join(''));

            g._upadteTreeWidth();

            $(">.l-children .l-body", parentNode).hover(function ()
            {
                $(this).addClass("l-over");
            }, function ()
            {
                $(this).removeClass("l-over");
            });
            g.trigger('afterAppend', [parentNode, newdata]);
        },
        cancelSelect: function (domNode)
        {
            var g = this, p = this.options;
            var treeitem = $(domNode);
            var treedataindex = parseInt(treeitem.attr("treedataindex"));
            var treenodedata = g._getDataNodeByTreeDataIndex(g.data, treedataindex);
            var treeitembody = $(">div:first", treeitem);
            if (p.checkbox)
                $(".l-checkbox", treeitembody).removeClass("l-checkbox-checked").addClass("l-checkbox-unchecked");
            else
                treeitembody.removeClass("l-selected");
            g.trigger('cancelSelect', [{ data: treenodedata, target: treeitem[0]}]);
        },
        //选择节点(参数：条件函数、Dom节点或ID值)
        selectNode: function (selectNodeParm)
        {
            var g = this, p = this.options;
            var clause = null;
            if (typeof (selectNodeParm) == "function")
            {
                clause = selectNodeParm;
            }
            else if (typeof (selectNodeParm) == "object")
            {
                var treeitem = $(selectNodeParm);
                var treedataindex = parseInt(treeitem.attr("treedataindex"));
                var treenodedata = g._getDataNodeByTreeDataIndex(g.data, treedataindex);
                var treeitembody = $(">div:first", treeitem);
                if (p.checkbox)
                    $(".l-checkbox", treeitembody).removeClass("l-checkbox-unchecked").addClass("l-checkbox-checked");
                else
                    treeitembody.addClass("l-selected");

                g.trigger('select', [{ data: treenodedata, target: treeitem[0]}]);
                return;
            }
            else
            {
                clause = function (data)
                {
                    if (!data[p.idFieldName]) return false;
                    return data[p.idFieldName].toString() == selectNodeParm.toString();
                };
            }
            $("li", g.tree).each(function ()
            {
                var treeitem = $(this);
                var treedataindex = parseInt(treeitem.attr("treedataindex"));
                var treenodedata = g._getDataNodeByTreeDataIndex(g.data, treedataindex);
                if (clause(treenodedata, treedataindex))
                {
                    g.selectNode(this);
                }
                else
                {
                    g.cancelSelect(this);
                }
            });
        },
        getTextByID: function (id)
        {
            var g = this, p = this.options;
            var data = g.getDataByID(id);
            if (!data) return null;
            return data[p.textFieldName];
        },
        getDataByID: function (id)
        {
            var g = this, p = this.options;
            var data = null;
            $("li", g.tree).each(function ()
            {
                if (data) return;
                var treeitem = $(this);
                var treedataindex = parseInt(treeitem.attr("treedataindex"));
                var treenodedata = g._getDataNodeByTreeDataIndex(g.data, treedataindex);
                if (treenodedata[p.idFieldName].toString() == id.toString())
                {
                    data = treenodedata;
                }
            });
            return data;
        },
        arrayToTree: function (data, id, pid)      //将ID、ParentID这种数据格式转换为树格式
        {
            if (!data || !data.length) return [];
            var targetData = [];                    //存储数据的容器(返回) 
            var records = {};
            var itemLength = data.length;           //数据集合的个数
            for (var i = 0; i < itemLength; i++)
            {
                var o = data[i];
                records[o[id]] = o;
            }
            for (var i = 0; i < itemLength; i++)
            {
                var currentData = data[i];
                var parentData = records[currentData[pid]];
                if (!parentData)
                {
                    targetData.push(currentData);
                    continue;
                }
                parentData.children = parentData.children || [];
                parentData.children.push(currentData);
            }
            return targetData;
        },
        //根据数据索引获取数据
        _getDataNodeByTreeDataIndex: function (data, treedataindex)
        {
            var g = this, p = this.options;
            for (var i = 0; i < data.length; i++)
            {
                if (data[i].treedataindex == treedataindex)
                    return data[i];
                if (data[i].children)
                {
                    var targetData = g._getDataNodeByTreeDataIndex(data[i].children, treedataindex);
                    if (targetData) return targetData;
                }
            }
            return null;
        },
        //设置数据状态
        _setTreeDataStatus: function (data, status)
        {
            var g = this, p = this.options;
            $(data).each(function ()
            {
                this[p.statusName] = status;
                if (this.children)
                {
                    g._setTreeDataStatus(this.children, status);
                }
            });
        },
        //设置data 索引
        _addTreeDataIndexToData: function (data)
        {
            var g = this, p = this.options;
            $(data).each(function ()
            {
                if (this.treedataindex != undefined) return;
                this.treedataindex = g.treedataindex++;
                if (this.children)
                {
                    g._addTreeDataIndexToData(this.children);
                }
            });
        },
        //添加项到g.data
        _appendData: function (treeNode, data)
        {
            var g = this, p = this.options;
            var treedataindex = parseInt($(treeNode).attr("treedataindex"));
            var treenodedata = g._getDataNodeByTreeDataIndex(g.data, treedataindex);
            if (g.treedataindex == undefined) g.treedataindex = 0;
            if (treenodedata && treenodedata.children == undefined) treenodedata.children = [];
            $(data).each(function (i, item)
            {
                if (treenodedata)
                    treenodedata.children[treenodedata.children.length] = $.extend({}, item);
                else
                    g.data[g.data.length] = $.extend({}, item);
            });
        },
        _setTreeItem: function (treeNode, options)
        {
            var g = this, p = this.options;
            if (!options) return;
            var treeItem = $(treeNode);
            var outlineLevel = parseInt(treeItem.attr("outlinelevel"));
            if (options.isLast != undefined)
            {
                if (options.isLast == true)
                {
                    treeItem.removeClass("l-last").addClass("l-last");
                    $("> div .l-note", treeItem).removeClass("l-note").addClass("l-note-last");
                    $(".l-children li", treeItem)
                            .find(".l-box:eq(" + (outlineLevel - 1) + ")")
                            .removeClass("l-line");
                }
                else if (options.isLast == false)
                {
                    treeItem.removeClass("l-last");
                    $("> div .l-note-last", treeItem).removeClass("l-note-last").addClass("l-note");

                    $(".l-children li", treeItem)
                            .find(".l-box:eq(" + (outlineLevel - 1) + ")")
                            .removeClass("l-line")
                            .addClass("l-line");
                }
            }
        },
        _upadteTreeWidth: function ()
        {
            var g = this, p = this.options;
            var treeWidth = g.maxOutlineLevel * 22;
            if (p.checkbox) treeWidth += 22;
            if (p.parentIcon || p.childIcon) treeWidth += 22;
            treeWidth += p.nodeWidth;
            g.tree.width(treeWidth);
        },
        _getChildNodeClassName: function ()
        {
            var g = this, p = this.options;
            return 'l-tree-icon-' + p.childIcon;
        },
        _getParentNodeClassName: function (isOpen)
        {
            var g = this, p = this.options;
            var nodeclassname = 'l-tree-icon-' + p.parentIcon;
            if (isOpen) nodeclassname += '-open';
            return nodeclassname;
        },
        //根据data生成最终完整的tree html
        _getTreeHTMLByData: function (data, outlineLevel, isLast, isExpand)
        {
            var g = this, p = this.options;
            if (g.maxOutlineLevel < outlineLevel)
                g.maxOutlineLevel = outlineLevel;
            isLast = isLast || [];
            outlineLevel = outlineLevel || 1;
            var treehtmlarr = [];
            if (!isExpand) treehtmlarr.push('<ul class="l-children" style="display:none">');
            else treehtmlarr.push("<ul class='l-children'>");
            for (var i = 0; i < data.length; i++)
            {
                var isFirst = i == 0;
                var isLastCurrent = i == data.length - 1;
                var isExpandCurrent = true;
                if (data[i].isexpand == false || data[i].isexpand == "false") isExpandCurrent = false;

                treehtmlarr.push('<li ');
                if (data[i].treedataindex != undefined)
                    treehtmlarr.push('treedataindex="' + data[i].treedataindex + '" ');
                if (isExpandCurrent)
                    treehtmlarr.push('isexpand=' + data[i].isexpand + ' ');
                treehtmlarr.push('outlinelevel=' + outlineLevel + ' ');
                //增加属性支持
                for (var j = 0; j < g.sysAttribute.length; j++)
                {
                    if ($(this).attr(g.sysAttribute[j]))
                        data[dataindex][g.sysAttribute[j]] = $(this).attr(g.sysAttribute[j]);
                }
                for (var j = 0; j < p.attribute.length; j++)
                {
                    if (data[i][p.attribute[j]])
                        treehtmlarr.push(p.attribute[j] + '="' + data[i][p.attribute[j]] + '" ');
                }

                //css class
                treehtmlarr.push('class="');
                isFirst && treehtmlarr.push('l-first ');
                isLastCurrent && treehtmlarr.push('l-last ');
                isFirst && isLastCurrent && treehtmlarr.push('l-onlychild ');
                treehtmlarr.push('"');
                treehtmlarr.push('>');
                treehtmlarr.push('<div class="l-body">');
                for (var k = 0; k <= outlineLevel - 2; k++)
                {
                    if (isLast[k]) treehtmlarr.push('<div class="l-box"></div>');
                    else treehtmlarr.push('<div class="l-box l-line"></div>');
                }
                if (g.hasChildren(data[i]))
                {
                    if (isExpandCurrent) treehtmlarr.push('<div class="l-box l-expandable-open"></div>');
                    else treehtmlarr.push('<div class="l-box l-expandable-close"></div>');
                    if (p.checkbox)
                    {
                        if (data[i].ischecked)
                            treehtmlarr.push('<div class="l-box l-checkbox l-checkbox-checked"></div>');
                        else
                            treehtmlarr.push('<div class="l-box l-checkbox l-checkbox-unchecked"></div>');
                    }

                    p.parentIcon && !isExpandCurrent && treehtmlarr.push('<div class="l-box ' + g._getParentNodeClassName() + '"></div>');
                    p.parentIcon && isExpandCurrent && treehtmlarr.push('<div class="l-box ' + g._getParentNodeClassName(true) + '"></div>');
                }
                else
                {
                    if (isLastCurrent) treehtmlarr.push('<div class="l-box l-note-last"></div>');
                    else treehtmlarr.push('<div class="l-box l-note"></div>');
                    if (p.checkbox)
                    {
                        if (data[i].ischecked)
                            treehtmlarr.push('<div class="l-box l-checkbox l-checkbox-checked"></div>');
                        else
                            treehtmlarr.push('<div class="l-box l-checkbox l-checkbox-unchecked"></div>');
                    }
                    p.childIcon && treehtmlarr.push('<div class="l-box ' + g._getChildNodeClassName() + '"></div>');
                }

                treehtmlarr.push('<span>' + data[i][p.textFieldName] + '</span></div>');
                if (g.hasChildren(data[i]))
                {
                    var isLastNew = [];
                    for (var k = 0; k < isLast.length; k++)
                    {
                        isLastNew.push(isLast[k]);
                    }
                    isLastNew.push(isLastCurrent);
                    treehtmlarr.push(g._getTreeHTMLByData(data[i].children, outlineLevel + 1, isLastNew, isExpandCurrent).join(''));
                }
                treehtmlarr.push('</li>');
            }
            treehtmlarr.push("</ul>");
            return treehtmlarr;

        },
        //根据简洁的html获取data
        _getDataByTreeHTML: function (treeDom)
        {
            var g = this, p = this.options;
            var data = [];
            $("> li", treeDom).each(function (i, item)
            {
                var dataindex = data.length;
                data[dataindex] =
                        {
                            treedataindex: g.treedataindex++
                        };
                data[dataindex][p.textFieldName] = $("> span,> a", this).html();
                for (var j = 0; j < g.sysAttribute.length; j++)
                {
                    if ($(this).attr(g.sysAttribute[j]))
                        data[dataindex][g.sysAttribute[j]] = $(this).attr(g.sysAttribute[j]);
                }
                for (var j = 0; j < p.attribute.length; j++)
                {
                    if ($(this).attr(p.attribute[j]))
                        data[dataindex][p.attribute[j]] = $(this).attr(p.attribute[j]);
                }
                if ($("> ul", this).length > 0)
                {
                    data[dataindex].children = g._getDataByTreeHTML($("> ul", this));
                }
            });
            return data;
        },
        _applyTree: function ()
        {
            var g = this, p = this.options;
            g.data = g._getDataByTreeHTML(g.tree);
            var gridhtmlarr = g._getTreeHTMLByData(g.data, 1, [], true);
            gridhtmlarr[gridhtmlarr.length - 1] = gridhtmlarr[0] = "";
            g.tree.html(gridhtmlarr.join(''));
            g._upadteTreeWidth();
            $(".l-body", g.tree).hover(function ()
            {
                $(this).addClass("l-over");
            }, function ()
            {
                $(this).removeClass("l-over");
            });
        },
        _applyTreeEven: function (treeNode)
        {
            var g = this, p = this.options;
            $("> .l-body", treeNode).hover(function ()
            {
                $(this).addClass("l-over");
            }, function ()
            {
                $(this).removeClass("l-over");
            });
        },
        _setTreeEven: function ()
        {
            var g = this, p = this.options;
            if (g.hasBind('contextmenu'))
            {
                g.tree.bind("contextmenu", function (e)
                { 
                    var obj = (e.target || e.srcElement);
                    var treeitem = null;
                    if (obj.tagName.toLowerCase() == "a" || obj.tagName.toLowerCase() == "span" || $(obj).hasClass("l-box"))
                        treeitem = $(obj).parent().parent();
                    else if ($(obj).hasClass("l-body"))
                        treeitem = $(obj).parent();
                    else if (obj.tagName.toLowerCase() == "li")
                        treeitem = $(obj);
                    if (!treeitem) return;
                    var treedataindex = parseInt(treeitem.attr("treedataindex"));
                    var treenodedata = g._getDataNodeByTreeDataIndex(g.data, treedataindex);
                    return g.trigger('contextmenu', [{ data: treenodedata, target: treeitem[0] }, e]);
                });
            }
            g.tree.click(function (e)
            {
                var obj = (e.target || e.srcElement);
                var treeitem = null;
                if (obj.tagName.toLowerCase() == "a" || obj.tagName.toLowerCase() == "span" || $(obj).hasClass("l-box"))
                    treeitem = $(obj).parent().parent();
                else if ($(obj).hasClass("l-body"))
                    treeitem = $(obj).parent();
                else
                    treeitem = $(obj);
                if (!treeitem) return;
                var treedataindex = parseInt(treeitem.attr("treedataindex"));
                var treenodedata = g._getDataNodeByTreeDataIndex(g.data, treedataindex); var treeitembtn = $(".l-body:first .l-expandable-open:first,.l-body:first .l-expandable-close:first", treeitem);
                if (!$(obj).hasClass("l-checkbox"))
                {
                    if ($(">div:first", treeitem).hasClass("l-selected"))
                    {
                        if (g.trigger('beforeCancelSelect', [{ data: treenodedata, target: treeitem[0]}]) == false)
                            return false;

                        $(">div:first", treeitem).removeClass("l-selected"); 
                        g.trigger('cancelSelect', [{ data: treenodedata, target: treeitem[0]}]); 
                    }
                    else
                    {
                        if (g.trigger('beforeSelect', [{ data: treenodedata, target: treeitem[0]}]) == false)
                            return false;
                        $(".l-body", g.tree).removeClass("l-selected");
                        $(">div:first", treeitem).addClass("l-selected");
                        g.trigger('select', [{ data: treenodedata, target: treeitem[0]}])
                    }
                }
                //chekcbox even
                if ($(obj).hasClass("l-checkbox"))
                {
                    if (p.autoCheckboxEven)
                    {
                        //状态：未选中
                        if ($(obj).hasClass("l-checkbox-unchecked"))
                        {
                            $(obj).removeClass("l-checkbox-unchecked").addClass("l-checkbox-checked");
                            $(".l-children .l-checkbox", treeitem)
                                    .removeClass("l-checkbox-incomplete l-checkbox-unchecked")
                                    .addClass("l-checkbox-checked");
                            g.trigger('check', [{ data: treenodedata, target: treeitem[0] }, true]);
                        }
                        //状态：选中
                        else if ($(obj).hasClass("l-checkbox-checked"))
                        {
                            $(obj).removeClass("l-checkbox-checked").addClass("l-checkbox-unchecked");
                            $(".l-children .l-checkbox", treeitem)
                                    .removeClass("l-checkbox-incomplete l-checkbox-checked")
                                    .addClass("l-checkbox-unchecked");
                            g.trigger('check', [{ data: treenodedata, target: treeitem[0] }, false]);
                        }
                        //状态：未完全选中
                        else if ($(obj).hasClass("l-checkbox-incomplete"))
                        {
                            $(obj).removeClass("l-checkbox-incomplete").addClass("l-checkbox-checked");
                            $(".l-children .l-checkbox", treeitem)
                                    .removeClass("l-checkbox-incomplete l-checkbox-unchecked")
                                    .addClass("l-checkbox-checked");
                            g.trigger('check', [{ data: treenodedata, target: treeitem[0] }, true]);
                        }
                        g._setParentCheckboxStatus(treeitem);
                    }
                    else
                    {
                        //状态：未选中
                        if ($(obj).hasClass("l-checkbox-unchecked"))
                        {
                            $(obj).removeClass("l-checkbox-unchecked").addClass("l-checkbox-checked");
                            //是否单选
                            if (p.single)
                            {
                                $(".l-checkbox", g.tree).not(obj).removeClass("l-checkbox-checked").addClass("l-checkbox-unchecked");
                            }
                            g.trigger('check', [{ data: treenodedata, target: treeitem[0] }, true]);
                        }
                        //状态：选中
                        else if ($(obj).hasClass("l-checkbox-checked"))
                        {
                            $(obj).removeClass("l-checkbox-checked").addClass("l-checkbox-unchecked");
                            g.trigger('check', [{ data: treenodedata, target: treeitem[0] }, false]);
                        }
                    }
                }
                //状态：已经张开
                else if (treeitembtn.hasClass("l-expandable-open"))
                {
                    if (g.trigger('beforeCollapse', [{ data: treenodedata, target: treeitem[0]}]) == false)
                        return false;
                    treeitembtn.removeClass("l-expandable-open").addClass("l-expandable-close");
                    if (p.slide)
                        $("> .l-children", treeitem).slideToggle('fast');
                    else
                        $("> .l-children", treeitem).toggle();
                    $("> div ." + g._getParentNodeClassName(true), treeitem)
                            .removeClass(g._getParentNodeClassName(true))
                            .addClass(g._getParentNodeClassName());
                    g.trigger('collapse', [{ data: treenodedata, target: treeitem[0]}]);
                }
                //状态：没有张开
                else if (treeitembtn.hasClass("l-expandable-close"))
                {
                    if (g.trigger('beforeExpand', [{ data: treenodedata, target: treeitem[0]}]) == false)
                        return false;
                    treeitembtn.removeClass("l-expandable-close").addClass("l-expandable-open");
                    var callback = function ()
                    { 
                        g.trigger('expand', [{ data: treenodedata, target: treeitem[0]}]);
                    };
                    if (p.slide)
                    {
                        $("> .l-children", treeitem).slideToggle('fast', callback);
                    }
                    else
                    {
                        $("> .l-children", treeitem).toggle();
                        callback();
                    }
                    $("> div ." + g._getParentNodeClassName(), treeitem)
                            .removeClass(g._getParentNodeClassName())
                            .addClass(g._getParentNodeClassName(true));
                }
                g.trigger('click', [{ data: treenodedata, target: treeitem[0]}]); 
            });
        },
        //递归设置父节点的状态
        _setParentCheckboxStatus: function (treeitem)
        {
            var g = this, p = this.options;
            //当前同级别或低级别的节点是否都选中了
            var isCheckedComplete = $(".l-checkbox-unchecked", treeitem.parent()).length == 0;
            //当前同级别或低级别的节点是否都没有选中
            var isCheckedNull = $(".l-checkbox-checked", treeitem.parent()).length == 0;
            if (isCheckedComplete)
            {
                treeitem.parent().prev().find(".l-checkbox")
                                    .removeClass("l-checkbox-unchecked l-checkbox-incomplete")
                                    .addClass("l-checkbox-checked");
            }
            else if (isCheckedNull)
            {
                treeitem.parent().prev().find("> .l-checkbox")
                                    .removeClass("l-checkbox-checked l-checkbox-incomplete")
                                    .addClass("l-checkbox-unchecked");
            }
            else
            {
                treeitem.parent().prev().find("> .l-checkbox")
                                    .removeClass("l-checkbox-unchecked l-checkbox-checked")
                                    .addClass("l-checkbox-incomplete");
            }
            if (treeitem.parent().parent("li").length > 0)
                g._setParentCheckboxStatus(treeitem.parent().parent("li"));
        }
    });


})(jQuery);