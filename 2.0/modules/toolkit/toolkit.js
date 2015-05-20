'use strict';
// temp
/* Chosen v1.4.1 | (c) 2011-2015 by Harvest | MIT License, https://github.com/harvesthq/chosen/blob/master/LICENSE.md */
(function() {
    var a, AbstractChosen, Chosen, SelectParser, b, c = {}.hasOwnProperty,
        d = function(a, b) {
            function d() {
                this.constructor = a
            }
            for (var e in b) c.call(b, e) && (a[e] = b[e]);
            return d.prototype = b.prototype, a.prototype = new d, a.__super__ = b.prototype, a
        };
    SelectParser = function() {
        function SelectParser() {
            this.options_index = 0, this.parsed = []
        }
        return SelectParser.prototype.add_node = function(a) {
            return "OPTGROUP" === a.nodeName.toUpperCase() ? this.add_group(a) : this.add_option(a)
        }, SelectParser.prototype.add_group = function(a) {
            var b, c, d, e, f, g;
            for (b = this.parsed.length, this.parsed.push({
                    array_index: b,
                    group: !0,
                    label: this.escapeExpression(a.label),
                    title: a.title ? a.title : void 0,
                    children: 0,
                    disabled: a.disabled,
                    classes: a.className
                }), f = a.childNodes, g = [], d = 0, e = f.length; e > d; d++) c = f[d], g.push(this.add_option(c, b, a.disabled));
            return g
        }, SelectParser.prototype.add_option = function(a, b, c) {
            return "OPTION" === a.nodeName.toUpperCase() ? ("" !== a.text ? (null != b && (this.parsed[b].children += 1), this.parsed.push({
                array_index: this.parsed.length,
                options_index: this.options_index,
                value: a.value,
                text: a.text,
                html: a.innerHTML,
                title: a.title ? a.title : void 0,
                selected: a.selected,
                disabled: c === !0 ? c : a.disabled,
                group_array_index: b,
                group_label: null != b ? this.parsed[b].label : null,
                classes: a.className,
                style: a.style.cssText
            })) : this.parsed.push({
                array_index: this.parsed.length,
                options_index: this.options_index,
                empty: !0
            }), this.options_index += 1) : void 0
        }, SelectParser.prototype.escapeExpression = function(a) {
            var b, c;
            return null == a || a === !1 ? "" : /[\&\<\>\"\'\`]/.test(a) ? (b = {
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#x27;",
                "`": "&#x60;"
            }, c = /&(?!\w+;)|[\<\>\"\'\`]/g, a.replace(c, function(a) {
                return b[a] || "&amp;"
            })) : a
        }, SelectParser
    }(), SelectParser.select_to_array = function(a) {
        var b, c, d, e, f;
        for (c = new SelectParser, f = a.childNodes, d = 0, e = f.length; e > d; d++) b = f[d], c.add_node(b);
        return c.parsed
    }, AbstractChosen = function() {
        function AbstractChosen(a, b) {
            this.form_field = a, this.options = null != b ? b : {}, AbstractChosen.browser_is_supported() && (this.is_multiple = this.form_field.multiple, this.set_default_text(), this.set_default_values(), this.setup(), this.set_up_html(), this.register_observers(), this.on_ready())
        }
        return AbstractChosen.prototype.set_default_values = function() {
            var a = this;
            return this.click_test_action = function(b) {
                return a.test_active_click(b)
            }, this.activate_action = function(b) {
                return a.activate_field(b)
            }, this.active_field = !1, this.mouse_on_container = !1, this.results_showing = !1, this.result_highlighted = null, this.allow_single_deselect = null != this.options.allow_single_deselect && null != this.form_field.options[0] && "" === this.form_field.options[0].text ? this.options.allow_single_deselect : !1, this.disable_search_threshold = this.options.disable_search_threshold || 0, this.disable_search = this.options.disable_search || !1, this.enable_split_word_search = null != this.options.enable_split_word_search ? this.options.enable_split_word_search : !0, this.group_search = null != this.options.group_search ? this.options.group_search : !0, this.search_contains = this.options.search_contains || !1, this.single_backstroke_delete = null != this.options.single_backstroke_delete ? this.options.single_backstroke_delete : !0, this.max_selected_options = this.options.max_selected_options || 1 / 0, this.inherit_select_classes = this.options.inherit_select_classes || !1, this.display_selected_options = null != this.options.display_selected_options ? this.options.display_selected_options : !0, this.display_disabled_options = null != this.options.display_disabled_options ? this.options.display_disabled_options : !0, this.include_group_label_in_selected = this.options.include_group_label_in_selected || !1
        }, AbstractChosen.prototype.set_default_text = function() {
            return this.default_text = this.form_field.getAttribute("data-placeholder") ? this.form_field.getAttribute("data-placeholder") : this.is_multiple ? this.options.placeholder_text_multiple || this.options.placeholder_text || AbstractChosen.default_multiple_text : this.options.placeholder_text_single || this.options.placeholder_text || AbstractChosen.default_single_text, this.results_none_found = this.form_field.getAttribute("data-no_results_text") || this.options.no_results_text || AbstractChosen.default_no_result_text
        }, AbstractChosen.prototype.choice_label = function(a) {
            return this.include_group_label_in_selected && null != a.group_label ? "<b class='group-name'>" + a.group_label + "</b>" + a.html : a.html
        }, AbstractChosen.prototype.mouse_enter = function() {
            return this.mouse_on_container = !0
        }, AbstractChosen.prototype.mouse_leave = function() {
            return this.mouse_on_container = !1
        }, AbstractChosen.prototype.input_focus = function() {
            var a = this;
            if (this.is_multiple) {
                if (!this.active_field) return setTimeout(function() {
                    return a.container_mousedown()
                }, 50)
            } else if (!this.active_field) return this.activate_field()
        }, AbstractChosen.prototype.input_blur = function() {
            var a = this;
            return this.mouse_on_container ? void 0 : (this.active_field = !1, setTimeout(function() {
                return a.blur_test()
            }, 100))
        }, AbstractChosen.prototype.results_option_build = function(a) {
            var b, c, d, e, f;
            for (b = "", f = this.results_data, d = 0, e = f.length; e > d; d++) c = f[d], b += c.group ? this.result_add_group(c) : this.result_add_option(c), (null != a ? a.first : void 0) && (c.selected && this.is_multiple ? this.choice_build(c) : c.selected && !this.is_multiple && this.single_set_selected_text(this.choice_label(c)));
            return b
        }, AbstractChosen.prototype.result_add_option = function(a) {
            var b, c;
            return a.search_match ? this.include_option_in_results(a) ? (b = [], a.disabled || a.selected && this.is_multiple || b.push("active-result"), !a.disabled || a.selected && this.is_multiple || b.push("disabled-result"), a.selected && b.push("result-selected"), null != a.group_array_index && b.push("group-option"), "" !== a.classes && b.push(a.classes), c = document.createElement("li"), c.className = b.join(" "), c.style.cssText = a.style, c.setAttribute("data-option-array-index", a.array_index), c.innerHTML = a.search_text, a.title && (c.title = a.title), this.outerHTML(c)) : "" : ""
        }, AbstractChosen.prototype.result_add_group = function(a) {
            var b, c;
            return a.search_match || a.group_match ? a.active_options > 0 ? (b = [], b.push("group-result"), a.classes && b.push(a.classes), c = document.createElement("li"), c.className = b.join(" "), c.innerHTML = a.search_text, a.title && (c.title = a.title), this.outerHTML(c)) : "" : ""
        }, AbstractChosen.prototype.results_update_field = function() {
            return this.set_default_text(), this.is_multiple || this.results_reset_cleanup(), this.result_clear_highlight(), this.results_build(), this.results_showing ? this.winnow_results() : void 0
        }, AbstractChosen.prototype.reset_single_select_options = function() {
            var a, b, c, d, e;
            for (d = this.results_data, e = [], b = 0, c = d.length; c > b; b++) a = d[b], a.selected ? e.push(a.selected = !1) : e.push(void 0);
            return e
        }, AbstractChosen.prototype.results_toggle = function() {
            return this.results_showing ? this.results_hide() : this.results_show()
        }, AbstractChosen.prototype.results_search = function() {
            return this.results_showing ? this.winnow_results() : this.results_show()
        }, AbstractChosen.prototype.winnow_results = function() {
            var a, b, c, d, e, f, g, h, i, j, k, l;
            for (this.no_results_clear(), d = 0, f = this.get_search_text(), a = f.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), i = new RegExp(a, "i"), c = this.get_search_regex(a), l = this.results_data, j = 0, k = l.length; k > j; j++) b = l[j], b.search_match = !1, e = null, this.include_option_in_results(b) && (b.group && (b.group_match = !1, b.active_options = 0), null != b.group_array_index && this.results_data[b.group_array_index] && (e = this.results_data[b.group_array_index], 0 === e.active_options && e.search_match && (d += 1), e.active_options += 1), b.search_text = b.group ? b.label : b.html, (!b.group || this.group_search) && (b.search_match = this.search_string_match(b.search_text, c), b.search_match && !b.group && (d += 1), b.search_match ? (f.length && (g = b.search_text.search(i), h = b.search_text.substr(0, g + f.length) + "</em>" + b.search_text.substr(g + f.length), b.search_text = h.substr(0, g) + "<em>" + h.substr(g)), null != e && (e.group_match = !0)) : null != b.group_array_index && this.results_data[b.group_array_index].search_match && (b.search_match = !0)));
            return this.result_clear_highlight(), 1 > d && f.length ? (this.update_results_content(""), this.no_results(f)) : (this.update_results_content(this.results_option_build()), this.winnow_results_set_highlight())
        }, AbstractChosen.prototype.get_search_regex = function(a) {
            var b;
            return b = this.search_contains ? "" : "^", new RegExp(b + a, "i")
        }, AbstractChosen.prototype.search_string_match = function(a, b) {
            var c, d, e, f;
            if (b.test(a)) return !0;
            if (this.enable_split_word_search && (a.indexOf(" ") >= 0 || 0 === a.indexOf("[")) && (d = a.replace(/\[|\]/g, "").split(" "), d.length))
                for (e = 0, f = d.length; f > e; e++)
                    if (c = d[e], b.test(c)) return !0
        }, AbstractChosen.prototype.choices_count = function() {
            var a, b, c, d;
            if (null != this.selected_option_count) return this.selected_option_count;
            for (this.selected_option_count = 0, d = this.form_field.options, b = 0, c = d.length; c > b; b++) a = d[b], a.selected && (this.selected_option_count += 1);
            return this.selected_option_count
        }, AbstractChosen.prototype.choices_click = function(a) {
            return a.preventDefault(), this.results_showing || this.is_disabled ? void 0 : this.results_show()
        }, AbstractChosen.prototype.keyup_checker = function(a) {
            var b, c;
            switch (b = null != (c = a.which) ? c : a.keyCode, this.search_field_scale(), b) {
                case 8:
                    if (this.is_multiple && this.backstroke_length < 1 && this.choices_count() > 0) return this.keydown_backstroke();
                    if (!this.pending_backstroke) return this.result_clear_highlight(), this.results_search();
                    break;
                case 13:
                    if (a.preventDefault(), this.results_showing) return this.result_select(a);
                    break;
                case 27:
                    return this.results_showing && this.results_hide(), !0;
                case 9:
                case 38:
                case 40:
                case 16:
                case 91:
                case 17:
                    break;
                default:
                    return this.results_search()
            }
        }, AbstractChosen.prototype.clipboard_event_checker = function() {
            var a = this;
            return setTimeout(function() {
                return a.results_search()
            }, 50)
        }, AbstractChosen.prototype.container_width = function() {
            return null != this.options.width ? this.options.width : "" + this.form_field.offsetWidth + "px"
        }, AbstractChosen.prototype.include_option_in_results = function(a) {
            return this.is_multiple && !this.display_selected_options && a.selected ? !1 : !this.display_disabled_options && a.disabled ? !1 : a.empty ? !1 : !0
        }, AbstractChosen.prototype.search_results_touchstart = function(a) {
            return this.touch_started = !0, this.search_results_mouseover(a)
        }, AbstractChosen.prototype.search_results_touchmove = function(a) {
            return this.touch_started = !1, this.search_results_mouseout(a)
        }, AbstractChosen.prototype.search_results_touchend = function(a) {
            return this.touch_started ? this.search_results_mouseup(a) : void 0
        }, AbstractChosen.prototype.outerHTML = function(a) {
            var b;
            return a.outerHTML ? a.outerHTML : (b = document.createElement("div"), b.appendChild(a), b.innerHTML)
        }, AbstractChosen.browser_is_supported = function() {
            return "Microsoft Internet Explorer" === window.navigator.appName ? document.documentMode >= 8 : /iP(od|hone)/i.test(window.navigator.userAgent) ? !1 : /Android/i.test(window.navigator.userAgent) && /Mobile/i.test(window.navigator.userAgent) ? !1 : !0
        }, AbstractChosen.default_multiple_text = "Select Some Options", AbstractChosen.default_single_text = "Select an Option", AbstractChosen.default_no_result_text = "No results match", AbstractChosen
    }(), a = jQuery, a.fn.extend({
        chosen: function(b) {
            return AbstractChosen.browser_is_supported() ? this.each(function() {
                var c, d;
                c = a(this), d = c.data("chosen"), "destroy" === b && d instanceof Chosen ? d.destroy() : d instanceof Chosen || c.data("chosen", new Chosen(this, b))
            }) : this
        }
    }), Chosen = function(c) {
        function Chosen() {
            return b = Chosen.__super__.constructor.apply(this, arguments)
        }
        return d(Chosen, c), Chosen.prototype.setup = function() {
            return this.form_field_jq = a(this.form_field), this.current_selectedIndex = this.form_field.selectedIndex, this.is_rtl = this.form_field_jq.hasClass("chosen-rtl")
        }, Chosen.prototype.set_up_html = function() {
            var b, c;
            return b = ["chosen-container"], b.push("chosen-container-" + (this.is_multiple ? "multi" : "single")), this.inherit_select_classes && this.form_field.className && b.push(this.form_field.className), this.is_rtl && b.push("chosen-rtl"), c = {
                "class": b.join(" "),
                style: "width: " + this.container_width() + ";",
                title: this.form_field.title
            }, this.form_field.id.length && (c.id = this.form_field.id.replace(/[^\w]/g, "_") + "_chosen"), this.container = a("<div />", c), this.is_multiple ? this.container.html('<ul class="chosen-choices"><li class="search-field"><input type="text" value="' + this.default_text + '" class="default" autocomplete="off" style="width:25px;" /></li></ul><div class="chosen-drop"><ul class="chosen-results"></ul></div>') : this.container.html('<a class="chosen-single chosen-default" tabindex="-1"><span>' + this.default_text + '</span><div><b></b></div></a><div class="chosen-drop"><div class="chosen-search"><input type="text" autocomplete="off" /></div><ul class="chosen-results"></ul></div>'), this.form_field_jq.hide().after(this.container), this.dropdown = this.container.find("div.chosen-drop").first(), this.search_field = this.container.find("input").first(), this.search_results = this.container.find("ul.chosen-results").first(), this.search_field_scale(), this.search_no_results = this.container.find("li.no-results").first(), this.is_multiple ? (this.search_choices = this.container.find("ul.chosen-choices").first(), this.search_container = this.container.find("li.search-field").first()) : (this.search_container = this.container.find("div.chosen-search").first(), this.selected_item = this.container.find(".chosen-single").first()), this.results_build(), this.set_tab_index(), this.set_label_behavior()
        }, Chosen.prototype.on_ready = function() {
            return this.form_field_jq.trigger("chosen:ready", {
                chosen: this
            })
        }, Chosen.prototype.register_observers = function() {
            var a = this;
            return this.container.bind("touchstart.chosen", function(b) {
                return a.container_mousedown(b), b.preventDefault()
            }), this.container.bind("touchend.chosen", function(b) {
                return a.container_mouseup(b), b.preventDefault()
            }), this.container.bind("mousedown.chosen", function(b) {
                a.container_mousedown(b)
            }), this.container.bind("mouseup.chosen", function(b) {
                a.container_mouseup(b)
            }), this.container.bind("mouseenter.chosen", function(b) {
                a.mouse_enter(b)
            }), this.container.bind("mouseleave.chosen", function(b) {
                a.mouse_leave(b)
            }), this.search_results.bind("mouseup.chosen", function(b) {
                a.search_results_mouseup(b)
            }), this.search_results.bind("mouseover.chosen", function(b) {
                a.search_results_mouseover(b)
            }), this.search_results.bind("mouseout.chosen", function(b) {
                a.search_results_mouseout(b)
            }), this.search_results.bind("mousewheel.chosen DOMMouseScroll.chosen", function(b) {
                a.search_results_mousewheel(b)
            }), this.search_results.bind("touchstart.chosen", function(b) {
                a.search_results_touchstart(b)
            }), this.search_results.bind("touchmove.chosen", function(b) {
                a.search_results_touchmove(b)
            }), this.search_results.bind("touchend.chosen", function(b) {
                a.search_results_touchend(b)
            }), this.form_field_jq.bind("chosen:updated.chosen", function(b) {
                a.results_update_field(b)
            }), this.form_field_jq.bind("chosen:activate.chosen", function(b) {
                a.activate_field(b)
            }), this.form_field_jq.bind("chosen:open.chosen", function(b) {
                a.container_mousedown(b)
            }), this.form_field_jq.bind("chosen:close.chosen", function(b) {
                a.input_blur(b)
            }), this.search_field.bind("blur.chosen", function(b) {
                a.input_blur(b)
            }), this.search_field.bind("keyup.chosen", function(b) {
                a.keyup_checker(b)
            }), this.search_field.bind("keydown.chosen", function(b) {
                a.keydown_checker(b)
            }), this.search_field.bind("focus.chosen", function(b) {
                a.input_focus(b)
            }), this.search_field.bind("cut.chosen", function(b) {
                a.clipboard_event_checker(b)
            }), this.search_field.bind("paste.chosen", function(b) {
                a.clipboard_event_checker(b)
            }), this.is_multiple ? this.search_choices.bind("click.chosen", function(b) {
                a.choices_click(b)
            }) : this.container.bind("click.chosen", function(a) {
                a.preventDefault()
            })
        }, Chosen.prototype.destroy = function() {
            return a(this.container[0].ownerDocument).unbind("click.chosen", this.click_test_action), this.search_field[0].tabIndex && (this.form_field_jq[0].tabIndex = this.search_field[0].tabIndex), this.container.remove(), this.form_field_jq.removeData("chosen"), this.form_field_jq.show()
        }, Chosen.prototype.search_field_disabled = function() {
            return this.is_disabled = this.form_field_jq[0].disabled, this.is_disabled ? (this.container.addClass("chosen-disabled"), this.search_field[0].disabled = !0, this.is_multiple || this.selected_item.unbind("focus.chosen", this.activate_action), this.close_field()) : (this.container.removeClass("chosen-disabled"), this.search_field[0].disabled = !1, this.is_multiple ? void 0 : this.selected_item.bind("focus.chosen", this.activate_action))
        }, Chosen.prototype.container_mousedown = function(b) {
            return this.is_disabled || (b && "mousedown" === b.type && !this.results_showing && b.preventDefault(), null != b && a(b.target).hasClass("search-choice-close")) ? void 0 : (this.active_field ? this.is_multiple || !b || a(b.target)[0] !== this.selected_item[0] && !a(b.target).parents("a.chosen-single").length || (b.preventDefault(), this.results_toggle()) : (this.is_multiple && this.search_field.val(""), a(this.container[0].ownerDocument).bind("click.chosen", this.click_test_action), this.results_show()), this.activate_field())
        }, Chosen.prototype.container_mouseup = function(a) {
            return "ABBR" !== a.target.nodeName || this.is_disabled ? void 0 : this.results_reset(a)
        }, Chosen.prototype.search_results_mousewheel = function(a) {
            var b;
            return a.originalEvent && (b = a.originalEvent.deltaY || -a.originalEvent.wheelDelta || a.originalEvent.detail), null != b ? (a.preventDefault(), "DOMMouseScroll" === a.type && (b = 40 * b), this.search_results.scrollTop(b + this.search_results.scrollTop())) : void 0
        }, Chosen.prototype.blur_test = function() {
            return !this.active_field && this.container.hasClass("chosen-container-active") ? this.close_field() : void 0
        }, Chosen.prototype.close_field = function() {
            return a(this.container[0].ownerDocument).unbind("click.chosen", this.click_test_action), this.active_field = !1, this.results_hide(), this.container.removeClass("chosen-container-active"), this.clear_backstroke(), this.show_search_field_default(), this.search_field_scale()
        }, Chosen.prototype.activate_field = function() {
            return this.container.addClass("chosen-container-active"), this.active_field = !0, this.search_field.val(this.search_field.val()), this.search_field.focus()
        }, Chosen.prototype.test_active_click = function(b) {
            var c;
            return c = a(b.target).closest(".chosen-container"), c.length && this.container[0] === c[0] ? this.active_field = !0 : this.close_field()
        }, Chosen.prototype.results_build = function() {
            return this.parsing = !0, this.selected_option_count = null, this.results_data = SelectParser.select_to_array(this.form_field), this.is_multiple ? this.search_choices.find("li.search-choice").remove() : this.is_multiple || (this.single_set_selected_text(), this.disable_search || this.form_field.options.length <= this.disable_search_threshold ? (this.search_field[0].readOnly = !0, this.container.addClass("chosen-container-single-nosearch")) : (this.search_field[0].readOnly = !1, this.container.removeClass("chosen-container-single-nosearch"))), this.update_results_content(this.results_option_build({
                first: !0
            })), this.search_field_disabled(), this.show_search_field_default(), this.search_field_scale(), this.parsing = !1
        }, Chosen.prototype.result_do_highlight = function(a) {
            var b, c, d, e, f;
            if (a.length) {
                if (this.result_clear_highlight(), this.result_highlight = a, this.result_highlight.addClass("highlighted"), d = parseInt(this.search_results.css("maxHeight"), 10), f = this.search_results.scrollTop(), e = d + f, c = this.result_highlight.position().top + this.search_results.scrollTop(), b = c + this.result_highlight.outerHeight(), b >= e) return this.search_results.scrollTop(b - d > 0 ? b - d : 0);
                if (f > c) return this.search_results.scrollTop(c)
            }
        }, Chosen.prototype.result_clear_highlight = function() {
            return this.result_highlight && this.result_highlight.removeClass("highlighted"), this.result_highlight = null
        }, Chosen.prototype.results_show = function() {
            return this.is_multiple && this.max_selected_options <= this.choices_count() ? (this.form_field_jq.trigger("chosen:maxselected", {
                chosen: this
            }), !1) : (this.container.addClass("chosen-with-drop"), this.results_showing = !0, this.search_field.focus(), this.search_field.val(this.search_field.val()), this.winnow_results(), this.form_field_jq.trigger("chosen:showing_dropdown", {
                chosen: this
            }))
        }, Chosen.prototype.update_results_content = function(a) {
            return this.search_results.html(a)
        }, Chosen.prototype.results_hide = function() {
            return this.results_showing && (this.result_clear_highlight(), this.container.removeClass("chosen-with-drop"), this.form_field_jq.trigger("chosen:hiding_dropdown", {
                chosen: this
            })), this.results_showing = !1
        }, Chosen.prototype.set_tab_index = function() {
            var a;
            return this.form_field.tabIndex ? (a = this.form_field.tabIndex, this.form_field.tabIndex = -1, this.search_field[0].tabIndex = a) : void 0
        }, Chosen.prototype.set_label_behavior = function() {
            var b = this;
            return this.form_field_label = this.form_field_jq.parents("label"), !this.form_field_label.length && this.form_field.id.length && (this.form_field_label = a("label[for='" + this.form_field.id + "']")), this.form_field_label.length > 0 ? this.form_field_label.bind("click.chosen", function(a) {
                return b.is_multiple ? b.container_mousedown(a) : b.activate_field()
            }) : void 0
        }, Chosen.prototype.show_search_field_default = function() {
            return this.is_multiple && this.choices_count() < 1 && !this.active_field ? (this.search_field.val(this.default_text), this.search_field.addClass("default")) : (this.search_field.val(""), this.search_field.removeClass("default"))
        }, Chosen.prototype.search_results_mouseup = function(b) {
            var c;
            return c = a(b.target).hasClass("active-result") ? a(b.target) : a(b.target).parents(".active-result").first(), c.length ? (this.result_highlight = c, this.result_select(b), this.search_field.focus()) : void 0
        }, Chosen.prototype.search_results_mouseover = function(b) {
            var c;
            return c = a(b.target).hasClass("active-result") ? a(b.target) : a(b.target).parents(".active-result").first(), c ? this.result_do_highlight(c) : void 0
        }, Chosen.prototype.search_results_mouseout = function(b) {
            return a(b.target).hasClass("active-result") ? this.result_clear_highlight() : void 0
        }, Chosen.prototype.choice_build = function(b) {
            var c, d, e = this;
            return c = a("<li />", {
                "class": "search-choice"
            }).html("<span>" + this.choice_label(b) + "</span>"), b.disabled ? c.addClass("search-choice-disabled") : (d = a("<a />", {
                "class": "search-choice-close",
                "data-option-array-index": b.array_index
            }), d.bind("click.chosen", function(a) {
                return e.choice_destroy_link_click(a)
            }), c.append(d)), this.search_container.before(c)
        }, Chosen.prototype.choice_destroy_link_click = function(b) {
            return b.preventDefault(), b.stopPropagation(), this.is_disabled ? void 0 : this.choice_destroy(a(b.target))
        }, Chosen.prototype.choice_destroy = function(a) {
            return this.result_deselect(a[0].getAttribute("data-option-array-index")) ? (this.show_search_field_default(), this.is_multiple && this.choices_count() > 0 && this.search_field.val().length < 1 && this.results_hide(), a.parents("li").first().remove(), this.search_field_scale()) : void 0
        }, Chosen.prototype.results_reset = function() {
            return this.reset_single_select_options(), this.form_field.options[0].selected = !0, this.single_set_selected_text(), this.show_search_field_default(), this.results_reset_cleanup(), this.form_field_jq.trigger("change"), this.active_field ? this.results_hide() : void 0
        }, Chosen.prototype.results_reset_cleanup = function() {
            return this.current_selectedIndex = this.form_field.selectedIndex, this.selected_item.find("abbr").remove()
        }, Chosen.prototype.result_select = function(a) {
            var b, c;
            return this.result_highlight ? (b = this.result_highlight, this.result_clear_highlight(), this.is_multiple && this.max_selected_options <= this.choices_count() ? (this.form_field_jq.trigger("chosen:maxselected", {
                chosen: this
            }), !1) : (this.is_multiple ? b.removeClass("active-result") : this.reset_single_select_options(), c = this.results_data[b[0].getAttribute("data-option-array-index")], c.selected = !0, this.form_field.options[c.options_index].selected = !0, this.selected_option_count = null, this.is_multiple ? this.choice_build(c) : this.single_set_selected_text(this.choice_label(c)), (a.metaKey || a.ctrlKey) && this.is_multiple || this.results_hide(), this.search_field.val(""), (this.is_multiple || this.form_field.selectedIndex !== this.current_selectedIndex) && this.form_field_jq.trigger("change", {
                selected: this.form_field.options[c.options_index].value
            }), this.current_selectedIndex = this.form_field.selectedIndex, a.preventDefault(), this.search_field_scale())) : void 0
        }, Chosen.prototype.single_set_selected_text = function(a) {
            return null == a && (a = this.default_text), a === this.default_text ? this.selected_item.addClass("chosen-default") : (this.single_deselect_control_build(), this.selected_item.removeClass("chosen-default")), this.selected_item.find("span").html(a)
        }, Chosen.prototype.result_deselect = function(a) {
            var b;
            return b = this.results_data[a], this.form_field.options[b.options_index].disabled ? !1 : (b.selected = !1, this.form_field.options[b.options_index].selected = !1, this.selected_option_count = null, this.result_clear_highlight(), this.results_showing && this.winnow_results(), this.form_field_jq.trigger("change", {
                deselected: this.form_field.options[b.options_index].value
            }), this.search_field_scale(), !0)
        }, Chosen.prototype.single_deselect_control_build = function() {
            return this.allow_single_deselect ? (this.selected_item.find("abbr").length || this.selected_item.find("span").first().after('<abbr class="search-choice-close"></abbr>'), this.selected_item.addClass("chosen-single-with-deselect")) : void 0
        }, Chosen.prototype.get_search_text = function() {
            return a("<div/>").text(a.trim(this.search_field.val())).html()
        }, Chosen.prototype.winnow_results_set_highlight = function() {
            var a, b;
            return b = this.is_multiple ? [] : this.search_results.find(".result-selected.active-result"), a = b.length ? b.first() : this.search_results.find(".active-result").first(), null != a ? this.result_do_highlight(a) : void 0
        }, Chosen.prototype.no_results = function(b) {
            var c;
            return c = a('<li class="no-results">' + this.results_none_found + ' "<span></span>"</li>'), c.find("span").first().html(b), this.search_results.append(c), this.form_field_jq.trigger("chosen:no_results", {
                chosen: this
            })
        }, Chosen.prototype.no_results_clear = function() {
            return this.search_results.find(".no-results").remove()
        }, Chosen.prototype.keydown_arrow = function() {
            var a;
            return this.results_showing && this.result_highlight ? (a = this.result_highlight.nextAll("li.active-result").first()) ? this.result_do_highlight(a) : void 0 : this.results_show()
        }, Chosen.prototype.keyup_arrow = function() {
            var a;
            return this.results_showing || this.is_multiple ? this.result_highlight ? (a = this.result_highlight.prevAll("li.active-result"), a.length ? this.result_do_highlight(a.first()) : (this.choices_count() > 0 && this.results_hide(), this.result_clear_highlight())) : void 0 : this.results_show()
        }, Chosen.prototype.keydown_backstroke = function() {
            var a;
            return this.pending_backstroke ? (this.choice_destroy(this.pending_backstroke.find("a").first()), this.clear_backstroke()) : (a = this.search_container.siblings("li.search-choice").last(), a.length && !a.hasClass("search-choice-disabled") ? (this.pending_backstroke = a, this.single_backstroke_delete ? this.keydown_backstroke() : this.pending_backstroke.addClass("search-choice-focus")) : void 0)
        }, Chosen.prototype.clear_backstroke = function() {
            return this.pending_backstroke && this.pending_backstroke.removeClass("search-choice-focus"), this.pending_backstroke = null
        }, Chosen.prototype.keydown_checker = function(a) {
            var b, c;
            switch (b = null != (c = a.which) ? c : a.keyCode, this.search_field_scale(), 8 !== b && this.pending_backstroke && this.clear_backstroke(), b) {
                case 8:
                    this.backstroke_length = this.search_field.val().length;
                    break;
                case 9:
                    this.results_showing && !this.is_multiple && this.result_select(a), this.mouse_on_container = !1;
                    break;
                case 13:
                    this.results_showing && a.preventDefault();
                    break;
                case 32:
                    this.disable_search && a.preventDefault();
                    break;
                case 38:
                    a.preventDefault(), this.keyup_arrow();
                    break;
                case 40:
                    a.preventDefault(), this.keydown_arrow()
            }
        }, Chosen.prototype.search_field_scale = function() {
            var b, c, d, e, f, g, h, i, j;
            if (this.is_multiple) {
                for (d = 0, h = 0, f = "position:absolute; left: -1000px; top: -1000px; display:none;", g = ["font-size", "font-style", "font-weight", "font-family", "line-height", "text-transform", "letter-spacing"], i = 0, j = g.length; j > i; i++) e = g[i], f += e + ":" + this.search_field.css(e) + ";";
                return b = a("<div />", {
                    style: f
                }), b.text(this.search_field.val()), a("body").append(b), h = b.width() + 25, b.remove(), c = this.container.outerWidth(), h > c - 10 && (h = c - 10), this.search_field.css({
                    width: h + "px"
                })
            }
        }, Chosen
    }(AbstractChosen)
}).call(this);

/*
 * Use this directive to convert drop downs into chosen drop downs.
 * http://harvesthq.github.io/chosen/
 * http://adityasharat.github.io/angular-chosen/
 */
(function(angular) {
    var AngularChosen = angular.module('angular.chosen', []);

    AngularChosen.directive('chosen', [

        function() {
            var EVENTS, scope, linker, watchCollection;

            /*
             * List of events and the alias used for binding with angularJS
             */
            EVENTS = [{
                onChange: 'change'
            }, {
                onReady: 'chosen:ready'
            }, {
                onMaxSelected: 'chosen:maxselected'
            }, {
                onShowDropdown: 'chosen:showing_dropdown'
            }, {
                onHideDropdown: 'chosen:hiding_dropdown'
            }, {
                onNoResult: 'chosen:no_results'
            }];

            /*
             * Items to be added in the scope of the directive
             */
            scope = {
                list: '=', // the options array
                enable: '=', // enable of disable the drop-down
                change: '=', // change will trigger the chosen:updated event
                model: '=', // the model to which the drop-down should bind,
                ngModel: '='
            };

            /*
             * initialize the list of items
             * to watch to trigger the chosen:updated event
             */
            watchCollection = [];
            Object.keys(scope).forEach(function(scopeName) {
                watchCollection.push(scopeName);
            });

            /*
             * Add the list of event handler of the chosen
             * in the scope.
             */
            EVENTS.forEach(function(event) {
                var eventNameAlias = Object.keys(event)[0];
                scope[eventNameAlias] = '=';
            });

            /* Linker for the directive */
            linker = function($scope, iElm, iAttr) {

                $scope.$on('update-chosen', function() {
                    iElm.trigger('chosen:updated');
                });


                var maxSelection = parseInt(iAttr.maxSelection, 10),
                    searchThreshold = parseInt(iAttr.searchThreshold, 10);

                if (isNaN(maxSelection) || maxSelection === Infinity) {
                    maxSelection = undefined;
                }

                if (isNaN(searchThreshold) || searchThreshold === Infinity) {
                    searchThreshold = undefined;
                }

                iElm.chosen({
                    width: '100%',
                    max_selected_options: maxSelection,
                    disable_search_threshold: searchThreshold,
                    search_contains: true
                });

                iElm.on('change', function() {
                    iElm.trigger('chosen:updated');
                });

                $scope.$watch('[' + watchCollection.join(',') + ']', function() {
                    iElm.trigger('chosen:updated');
                }, true);

                // assign event handlers
                EVENTS.forEach(function(event) {
                    var eventNameAlias = Object.keys(event)[0];

                    if (typeof $scope[eventNameAlias] === 'function') { // check if the handler is a function
                        iElm.on(event[eventNameAlias], function(event) {
                            $scope.$apply(function() {
                                $scope[eventNameAlias](event);
                            });
                        }); // listen to the event triggered by chosen
                    }
                });
            };

            // return the directive
            return {
                name: 'chosen',
                scope: scope,
                restrict: 'A',
                link: linker
            };
        }
    ]);
}(angular));

/*!
 * screenfull
 * v2.0.0 - 2014-12-22
 * (c) Sindre Sorhus; MIT License
 */
! function() {
    "use strict";
    var a = "undefined" != typeof module && module.exports,
        b = "undefined" != typeof Element && "ALLOW_KEYBOARD_INPUT" in Element,
        c = function() {
            for (var a, b, c = [
                    ["requestFullscreen", "exitFullscreen", "fullscreenElement", "fullscreenEnabled", "fullscreenchange", "fullscreenerror"],
                    ["webkitRequestFullscreen", "webkitExitFullscreen", "webkitFullscreenElement", "webkitFullscreenEnabled", "webkitfullscreenchange", "webkitfullscreenerror"],
                    ["webkitRequestFullScreen", "webkitCancelFullScreen", "webkitCurrentFullScreenElement", "webkitCancelFullScreen", "webkitfullscreenchange", "webkitfullscreenerror"],
                    ["mozRequestFullScreen", "mozCancelFullScreen", "mozFullScreenElement", "mozFullScreenEnabled", "mozfullscreenchange", "mozfullscreenerror"],
                    ["msRequestFullscreen", "msExitFullscreen", "msFullscreenElement", "msFullscreenEnabled", "MSFullscreenChange", "MSFullscreenError"]
                ], d = 0, e = c.length, f = {}; e > d; d++)
                if (a = c[d], a && a[1] in document) {
                    for (d = 0, b = a.length; b > d; d++) f[c[0][d]] = a[d];
                    return f
                }
            return !1
        }(),
        d = {
            request: function(a) {
                var d = c.requestFullscreen;
                a = a || document.documentElement, /5\.1[\.\d]* Safari/.test(navigator.userAgent) ? a[d]() : a[d](b && Element.ALLOW_KEYBOARD_INPUT)
            },
            exit: function() {
                document[c.exitFullscreen]()
            },
            toggle: function(a) {
                this.isFullscreen ? this.exit() : this.request(a)
            },
            raw: c
        };
    return c ? (Object.defineProperties(d, {
        isFullscreen: {
            get: function() {
                return !!document[c.fullscreenElement]
            }
        },
        element: {
            enumerable: !0,
            get: function() {
                return document[c.fullscreenElement]
            }
        },
        enabled: {
            enumerable: !0,
            get: function() {
                return !!document[c.fullscreenEnabled]
            }
        }
    }), void(a ? module.exports = d : window.screenfull = d)) : void(a ? module.exports = !1 : window.screenfull = !1)
}();


/**
 * An Angular module that gives you access to the browsers local storage
 * @version v0.1.5 - 2014-11-04
 * @link https://github.com/grevory/angular-local-storage
 * @author grevory <greg@gregpike.ca>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
(function(window, angular, undefined) {
    /*jshint globalstrict:true*/
    'use strict';

    var isDefined = angular.isDefined,
        isUndefined = angular.isUndefined,
        isNumber = angular.isNumber,
        isObject = angular.isObject,
        isArray = angular.isArray,
        extend = angular.extend,
        toJson = angular.toJson,
        fromJson = angular.fromJson;


    // Test if string is only contains numbers
    // e.g '1' => true, "'1'" => true
    function isStringNumber(num) {
        return /^-?\d+\.?\d*$/.test(num.replace(/["']/g, ''));
    }

    var angularLocalStorage = angular.module('LocalStorageModule', []);

    angularLocalStorage.provider('localStorageService', function() {

        // You should set a prefix to avoid overwriting any local storage variables from the rest of your app
        // e.g. localStorageServiceProvider.setPrefix('youAppName');
        // With provider you can use config as this:
        // myApp.config(function (localStorageServiceProvider) {
        //    localStorageServiceProvider.prefix = 'yourAppName';
        // });
        this.prefix = 'ls';

        // You could change web storage type localstorage or sessionStorage
        this.storageType = 'localStorage';

        // Cookie options (usually in case of fallback)
        // expiry = Number of days before cookies expire // 0 = Does not expire
        // path = The web path the cookie represents
        this.cookie = {
            expiry: 30,
            path: '/'
        };

        // Send signals for each of the following actions?
        this.notify = {
            setItem: true,
            removeItem: false
        };

        // Setter for the prefix
        this.setPrefix = function(prefix) {
            this.prefix = prefix;
            return this;
        };

        // Setter for the storageType
        this.setStorageType = function(storageType) {
            this.storageType = storageType;
            return this;
        };

        // Setter for cookie config
        this.setStorageCookie = function(exp, path) {
            this.cookie = {
                expiry: exp,
                path: path
            };
            return this;
        };

        // Setter for cookie domain
        this.setStorageCookieDomain = function(domain) {
            this.cookie.domain = domain;
            return this;
        };

        // Setter for notification config
        // itemSet & itemRemove should be booleans
        this.setNotify = function(itemSet, itemRemove) {
            this.notify = {
                setItem: itemSet,
                removeItem: itemRemove
            };
            return this;
        };

        this.$get = ['$rootScope', '$window', '$document', '$parse', function($rootScope, $window, $document, $parse) {
            var self = this;
            var prefix = self.prefix;
            var cookie = self.cookie;
            var notify = self.notify;
            var storageType = self.storageType;
            var webStorage;

            // When Angular's $document is not available
            if (!$document) {
                $document = document;
            } else if ($document[0]) {
                $document = $document[0];
            }

            // If there is a prefix set in the config lets use that with an appended period for readability
            if (prefix.substr(-1) !== '.') {
                prefix = !!prefix ? prefix + '.' : '';
            }
            var deriveQualifiedKey = function(key) {
                return prefix + key;
            };
            // Checks the browser to see if local storage is supported
            var browserSupportsLocalStorage = (function() {
                try {
                    var supported = (storageType in $window && $window[storageType] !== null);

                    // When Safari (OS X or iOS) is in private browsing mode, it appears as though localStorage
                    // is available, but trying to call .setItem throws an exception.
                    //
                    // "QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was made to add something to storage
                    // that exceeded the quota."
                    var key = deriveQualifiedKey('__' + Math.round(Math.random() * 1e7));
                    if (supported) {
                        webStorage = $window[storageType];
                        webStorage.setItem(key, '');
                        webStorage.removeItem(key);
                    }

                    return supported;
                } catch (e) {
                    storageType = 'cookie';
                    $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
                    return false;
                }
            }());



            // Directly adds a value to local storage
            // If local storage is not available in the browser use cookies
            // Example use: localStorageService.add('library','angular');
            var addToLocalStorage = function(key, value) {
                // Let's convert undefined values to null to get the value consistent
                if (isUndefined(value)) {
                    value = null;
                } else if (isObject(value) || isArray(value) || isNumber(+value || value)) {
                    value = toJson(value);
                }

                // If this browser does not support local storage use cookies
                if (!browserSupportsLocalStorage || self.storageType === 'cookie') {
                    if (!browserSupportsLocalStorage) {
                        $rootScope.$broadcast('LocalStorageModule.notification.warning', 'LOCAL_STORAGE_NOT_SUPPORTED');
                    }

                    if (notify.setItem) {
                        $rootScope.$broadcast('LocalStorageModule.notification.setitem', {
                            key: key,
                            newvalue: value,
                            storageType: 'cookie'
                        });
                    }
                    return addToCookies(key, value);
                }

                try {
                    if (isObject(value) || isArray(value)) {
                        value = toJson(value);
                    }
                    if (webStorage) {
                        webStorage.setItem(deriveQualifiedKey(key), value)
                    };
                    if (notify.setItem) {
                        $rootScope.$broadcast('LocalStorageModule.notification.setitem', {
                            key: key,
                            newvalue: value,
                            storageType: self.storageType
                        });
                    }
                } catch (e) {
                    $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
                    return addToCookies(key, value);
                }
                return true;
            };

            // Directly get a value from local storage
            // Example use: localStorageService.get('library'); // returns 'angular'
            var getFromLocalStorage = function(key) {

                if (!browserSupportsLocalStorage || self.storageType === 'cookie') {
                    if (!browserSupportsLocalStorage) {
                        $rootScope.$broadcast('LocalStorageModule.notification.warning', 'LOCAL_STORAGE_NOT_SUPPORTED');
                    }

                    return getFromCookies(key);
                }

                var item = webStorage ? webStorage.getItem(deriveQualifiedKey(key)) : null;
                // angular.toJson will convert null to 'null', so a proper conversion is needed
                // FIXME not a perfect solution, since a valid 'null' string can't be stored
                if (!item || item === 'null') {
                    return null;
                }

                if (item.charAt(0) === "{" || item.charAt(0) === "[" || isStringNumber(item)) {
                    return fromJson(item);
                }

                return item;
            };

            // Remove an item from local storage
            // Example use: localStorageService.remove('library'); // removes the key/value pair of library='angular'
            var removeFromLocalStorage = function(key) {
                if (!browserSupportsLocalStorage || self.storageType === 'cookie') {
                    if (!browserSupportsLocalStorage) {
                        $rootScope.$broadcast('LocalStorageModule.notification.warning', 'LOCAL_STORAGE_NOT_SUPPORTED');
                    }

                    if (notify.removeItem) {
                        $rootScope.$broadcast('LocalStorageModule.notification.removeitem', {
                            key: key,
                            storageType: 'cookie'
                        });
                    }
                    return removeFromCookies(key);
                }

                try {
                    webStorage.removeItem(deriveQualifiedKey(key));
                    if (notify.removeItem) {
                        $rootScope.$broadcast('LocalStorageModule.notification.removeitem', {
                            key: key,
                            storageType: self.storageType
                        });
                    }
                } catch (e) {
                    $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
                    return removeFromCookies(key);
                }
                return true;
            };

            // Return array of keys for local storage
            // Example use: var keys = localStorageService.keys()
            var getKeysForLocalStorage = function() {

                if (!browserSupportsLocalStorage) {
                    $rootScope.$broadcast('LocalStorageModule.notification.warning', 'LOCAL_STORAGE_NOT_SUPPORTED');
                    return false;
                }

                var prefixLength = prefix.length;
                var keys = [];
                for (var key in webStorage) {
                    // Only return keys that are for this app
                    if (key.substr(0, prefixLength) === prefix) {
                        try {
                            keys.push(key.substr(prefixLength));
                        } catch (e) {
                            $rootScope.$broadcast('LocalStorageModule.notification.error', e.Description);
                            return [];
                        }
                    }
                }
                return keys;
            };

            // Remove all data for this app from local storage
            // Also optionally takes a regular expression string and removes the matching key-value pairs
            // Example use: localStorageService.clearAll();
            // Should be used mostly for development purposes
            var clearAllFromLocalStorage = function(regularExpression) {

                regularExpression = regularExpression || "";
                //accounting for the '.' in the prefix when creating a regex
                var tempPrefix = prefix.slice(0, -1);
                var testRegex = new RegExp(tempPrefix + '.' + regularExpression);

                if (!browserSupportsLocalStorage || self.storageType === 'cookie') {
                    if (!browserSupportsLocalStorage) {
                        $rootScope.$broadcast('LocalStorageModule.notification.warning', 'LOCAL_STORAGE_NOT_SUPPORTED');
                    }

                    return clearAllFromCookies();
                }

                var prefixLength = prefix.length;

                for (var key in webStorage) {
                    // Only remove items that are for this app and match the regular expression
                    if (testRegex.test(key)) {
                        try {
                            removeFromLocalStorage(key.substr(prefixLength));
                        } catch (e) {
                            $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
                            return clearAllFromCookies();
                        }
                    }
                }
                return true;
            };

            // Checks the browser to see if cookies are supported
            var browserSupportsCookies = (function() {
                try {
                    return $window.navigator.cookieEnabled ||
                        ("cookie" in $document && ($document.cookie.length > 0 ||
                            ($document.cookie = "test").indexOf.call($document.cookie, "test") > -1));
                } catch (e) {
                    $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
                    return false;
                }
            }());

            // Directly adds a value to cookies
            // Typically used as a fallback is local storage is not available in the browser
            // Example use: localStorageService.cookie.add('library','angular');
            var addToCookies = function(key, value) {

                if (isUndefined(value)) {
                    return false;
                } else if (isArray(value) || isObject(value)) {
                    value = toJson(value);
                }

                if (!browserSupportsCookies) {
                    $rootScope.$broadcast('LocalStorageModule.notification.error', 'COOKIES_NOT_SUPPORTED');
                    return false;
                }

                try {
                    var expiry = '',
                        expiryDate = new Date(),
                        cookieDomain = '';

                    if (value === null) {
                        // Mark that the cookie has expired one day ago
                        expiryDate.setTime(expiryDate.getTime() + (-1 * 24 * 60 * 60 * 1000));
                        expiry = "; expires=" + expiryDate.toGMTString();
                        value = '';
                    } else if (cookie.expiry !== 0) {
                        expiryDate.setTime(expiryDate.getTime() + (cookie.expiry * 24 * 60 * 60 * 1000));
                        expiry = "; expires=" + expiryDate.toGMTString();
                    }
                    if (!!key) {
                        var cookiePath = "; path=" + cookie.path;
                        if (cookie.domain) {
                            cookieDomain = "; domain=" + cookie.domain;
                        }
                        $document.cookie = deriveQualifiedKey(key) + "=" + encodeURIComponent(value) + expiry + cookiePath + cookieDomain;
                    }
                } catch (e) {
                    $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
                    return false;
                }
                return true;
            };

            // Directly get a value from a cookie
            // Example use: localStorageService.cookie.get('library'); // returns 'angular'
            var getFromCookies = function(key) {
                if (!browserSupportsCookies) {
                    $rootScope.$broadcast('LocalStorageModule.notification.error', 'COOKIES_NOT_SUPPORTED');
                    return false;
                }

                var cookies = $document.cookie && $document.cookie.split(';') || [];
                for (var i = 0; i < cookies.length; i++) {
                    var thisCookie = cookies[i];
                    while (thisCookie.charAt(0) === ' ') {
                        thisCookie = thisCookie.substring(1, thisCookie.length);
                    }
                    if (thisCookie.indexOf(deriveQualifiedKey(key) + '=') === 0) {
                        var storedValues = decodeURIComponent(thisCookie.substring(prefix.length + key.length + 1, thisCookie.length))
                        try {
                            var obj = JSON.parse(storedValues);
                            return fromJson(obj)
                        } catch (e) {
                            return storedValues
                        }
                    }
                }
                return null;
            };

            var removeFromCookies = function(key) {
                addToCookies(key, null);
            };

            var clearAllFromCookies = function() {
                var thisCookie = null,
                    thisKey = null;
                var prefixLength = prefix.length;
                var cookies = $document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                    thisCookie = cookies[i];

                    while (thisCookie.charAt(0) === ' ') {
                        thisCookie = thisCookie.substring(1, thisCookie.length);
                    }

                    var key = thisCookie.substring(prefixLength, thisCookie.indexOf('='));
                    removeFromCookies(key);
                }
            };

            var getStorageType = function() {
                return storageType;
            };

            // Add a listener on scope variable to save its changes to local storage
            // Return a function which when called cancels binding
            var bindToScope = function(scope, key, def, lsKey) {
                lsKey = lsKey || key;
                var value = getFromLocalStorage(lsKey);

                if (value === null && isDefined(def)) {
                    value = def;
                } else if (isObject(value) && isObject(def)) {
                    value = extend(def, value);
                }

                $parse(key).assign(scope, value);

                return scope.$watch(key, function(newVal) {
                    addToLocalStorage(lsKey, newVal);
                }, isObject(scope[key]));
            };

            // Return localStorageService.length
            // ignore keys that not owned
            var lengthOfLocalStorage = function() {
                var count = 0;
                var storage = $window[storageType];
                for (var i = 0; i < storage.length; i++) {
                    if (storage.key(i).indexOf(prefix) === 0) {
                        count++;
                    }
                }
                return count;
            };

            return {
                isSupported: browserSupportsLocalStorage,
                getStorageType: getStorageType,
                set: addToLocalStorage,
                add: addToLocalStorage, //DEPRECATED
                get: getFromLocalStorage,
                keys: getKeysForLocalStorage,
                remove: removeFromLocalStorage,
                clearAll: clearAllFromLocalStorage,
                bind: bindToScope,
                deriveKey: deriveQualifiedKey,
                length: lengthOfLocalStorage,
                cookie: {
                    isSupported: browserSupportsCookies,
                    set: addToCookies,
                    add: addToCookies, //DEPRECATED
                    get: getFromCookies,
                    remove: removeFromCookies,
                    clearAll: clearAllFromCookies
                }
            };
        }];
    });
})(window, window.angular);

angular.module('pop.search.table', []).
factory('TableManager', ['$rootScope', '$filter', '$timeout',
    function($rootScope, $filter, $timeout) {
        var that = this;

        this.buildTable = function(table_name, config) {
            console.log(table_name, ' : Config: ', config);
            var table = {};
            table.name = table_name;
            table.modelName = config.model;
            table.headers = config.headers;
            table.modelIdentifier = config.labels;
            table.currentPage = undefined;
            table.gap = 0;
            table.pagedItems = [];
            table.options = {};
            table.options.showArchived = config.showArchived;
            table.options.orderByField = config.orderBy || 'name';
            table.options.reverseOrder = false;
            table.options.search = {};
            table.options.searchBy = config.searchBy || 'name';
            table.options.itemsPerPage = config.itemsPerPage || 25;
            return table;
        }

        this.search = function(table) {
            console.log('searchBy: ', table.options.searchBy);
            console.log('orderByField: ', table.options.orderByField);
            console.log('reverseOrder: ', table.options.reverseOrder);
            if (table && table.model) {
                if (typeof table.model === undefined) {
                    return;
                }
                var tableModelArray = jQuery.map(table.model, function(value, index) {
                    return [value];
                });
                var filteredItems = $filter('filter')(tableModelArray, function(item) {
                    if (!table.options.showArchived && item.active == "0")
                        return false;

                    if (table.options.search[table.options.searchBy] && table.options.search[table.options.searchBy] !== '') {
                        if (that.searchMatch(item[table.options.searchBy], table.options.search[table.options.searchBy]))
                            return true;
                    } else {
                        return true;
                    }

                    return false;
                });

                // take care of the sorting order
                if (table.options.orderByField !== '') {
                    filteredItems = that.filterTable(filteredItems, table.options.orderByField, table.options.reverseOrder);
                }
                table.currentPage = 0;
                // now group by pages
                table.pagedItems = [];
                for (var i = 0; i < filteredItems.length; i++) {
                    if (i % table.options.itemsPerPage === 0) {
                        table.pagedItems[Math.floor(i / table.options.itemsPerPage)] = [filteredItems[i]];
                    } else {
                        table.pagedItems[Math.floor(i / table.options.itemsPerPage)].push(filteredItems[i]);
                    }
                }
                table.gap = table.pagedItems.length;
            }
        };

        this.searchMatch = function(haystack, needle) {
            if (!needle)
                return true;
            return haystack.toLowerCase().indexOf(needle.toLowerCase()) !== -1;
        };

        this.setShowArchived = function(table, value) {
            table.showArchived = value;
        }

        this.filterTable = function(items, field, reverse) {
            var filtered = [];
            angular.forEach(items, function(item) {
                filtered.push(item);
            });
            filtered.sort(function(a, b) {
                if (!a && !b) {
                    return 0;
                }
                if (a && !b) {
                    return 1;
                }
                if (b && !a) {
                    return -1;
                }
                if (!a[field] && !b[field]) {
                    return 0;
                }
                if (a[field] && !b[field]) {
                    return 1;
                }
                if (!a[field] && b[field]) {
                    return -1;
                }
                if (a[field] === '' || b[field] === '') {
                    return -1;
                }
                if ((angular.isArray(a[field]) && !a[field].length) && (angular.isArray(b[field]) && !b[field].length)) {
                    return 0;
                }
                if ((angular.isArray(a[field]) && a[field].length) && (angular.isArray(b[field]) && !b[field].length)) {
                    return 1;
                }
                if ((angular.isArray(a[field]) && !a[field].length) && (angular.isArray(b[field]) && b[field].length)) {
                    return -1;
                }
                if (angular.isArray(a[field]) || angular.isArray(b[field])) {
                    if (!a[field][0][field] || !b[field][0][field]) {
                        return -1;
                    } else {
                        return (a[field][0][field].toLowerCase() > b[field][0][field].toLowerCase() ? 1 : -1);
                    }
                } else {
                    if (parseInt(a[field], 10) > 0 || parseInt(a[field], 10) > 0) {
                        return (parseInt(a[field], 10) > parseInt(b[field], 10) ? 1 : -1);
                    } else {
                        return (a[field].toLowerCase() > b[field].toLowerCase() ? 1 : -1);
                    }

                }
            });
            if (reverse) filtered.reverse();

            return filtered;
        };

        this.prevPage = function(table) {
            if (table.currentPage > 0) {
                table.currentPage--;
            }
        };

        this.nextPage = function(table) {
            if (table.currentPage < table.pagedItems.length - 1) {
                table.currentPage++;
            }
        };

        this.setPage = function(table, index) {
            table.currentPage = index;
        };

        this.updateModel = function(table, model) {
            table.model = model;
        }


        return this;
    }
]).directive('searchTable', ['$timeout', '$filter', 'TableManager', function($timeout, $filter, TableManager) {
    return {
        replace: true,
        restrict: 'E',
        scope: true,
        // creates an internal scope for this directive
        link: function(scope, elm, attrs) {
            if (!attrs.name) {
                scope.broadcastMessage({
                    type: 'warning',
                    title: 'Search Table Error',
                    body: 'data-name not set on search table directive',
                    timeout: 10000
                });
                return false
            }
            if (!attrs.config) {
                scope.broadcastMessage({
                    type: 'warning',
                    title: 'Search Table Error - ' + attrs.name,
                    body: 'data-config not set on search table directive',
                    timeout: 10000
                });
                return false
            }
            if (!scope.tables) {
                scope.broadcastMessage({
                    type: 'warning',
                    title: 'Search Table Error - ' + attrs.name,
                    body: '$scope.tables Object not defined on main $scope',
                    timeout: 10000
                });
            }
            if (!scope.filterRow) {
                scope.broadcastMessage({
                    type: 'warning',
                    title: 'Search Table Error - ' + attrs.name,
                    body: '$scope.filterRow(item) not defined on main $scope',
                    timeout: 10000
                });
            }
            scope.tables[attrs.name] = TableManager.buildTable(attrs.name, angular.fromJson(attrs.config));
            scope.tables[attrs.name].model = scope[scope.tables[attrs.name].modelName];
            scope.tables[attrs.name].options.showArchived = scope.options.showArchived;
            scope.tables[attrs.name].options.searchBy = angular.fromJson(attrs.config).searchBy;
            scope.tables[attrs.name].options.orderByField = angular.fromJson(attrs.config).orderByField;
            scope.tables[attrs.name].options.orderByField = angular.fromJson(attrs.config).orderByField;
            scope.tables[attrs.name].options.itemsPerPage = angular.fromJson(attrs.config).itemsPerPage || 25;

            // init the filtered items
            scope.search = function() {
                TableManager.search(scope.tables[attrs.name])
            };


            scope.range = function(size, start, end) {
                var ret = [];

                if (size < end) {
                    end = size;
                    start = size - scope.tables[attrs.name].gap;
                }
                for (var i = start; i < end; i++) {
                    ret.push(i);
                }
                return ret;
            };

            scope.prevPage = function() {
                TableManager.prevPage(scope.tables[attrs.name]);
            };

            scope.nextPage = function() {
                TableManager.nextPage(scope.tables[attrs.name]);
            };

            scope.setPage = function(index) {
                console.log(attrs.name, index);
                TableManager.setPage(scope.tables[attrs.name], index);
            };

            scope.$on('updateTable', function(event, table_name) {
                if (table_name == attrs.name) {
                    scope.tables[attrs.name] = TableManager.buildTable(attrs.name, angular.toJson(attrs.config));
                    scope.tables[attrs.name].model = scope[scope.tables[attrs.name].modelName];
                }
            });
            $timeout(function() {
                TableManager.search(scope.tables[attrs.name])
            });
        },
        templateUrl: './components/com_callcenter/js/AngularJs/modules/toolkit/tmpl/search-table.html'
    };
}]);





/**
 * pop.toolkit Module
 *
 * Description
 */
angular.module('pop.toolkit', ['LocalStorageModule', 'angular.chosen', 'pop.search.table']);



//Directives

angular.module('pop.toolkit').directive('summernote', function() {
    return {
        scope: true,
        restrict: 'A',
        link: function(scope, elm, attrs) {
            elm.summernote({
                airMode: true,
                toolbar: [
                    //[groupname, [button list]]
                    ['style', ['bold', 'italic', 'underline', 'clear']],
                    ['font', ['strikethrough']],
                    ['fontsize', ['fontsize']],
                    ['color', ['color']],
                    ['para', ['ul', 'ol', 'paragraph']],
                    ['height', ['height']],
                ]
            });
        }
    };
});

angular.module('pop.toolkit').directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            if (event.which === 13) {
                scope.$apply(function() {
                    scope.$eval(attrs.ngEnter);
                });

                event.preventDefault();
            }
        });
    };
});

angular.module('pop.toolkit').directive('focusMe', function() {
    return {
        restrict: 'A',
        scope: {
            focusMe: '='
        },
        link: function(scope, elt) {
            scope.$watch('focusMe', function(val) {
                if (val) {
                    elt[0].focus();
                }
            });
        }
    };
});

angular.module('pop.toolkit').directive('popDraggable', function() {
    return {
        restrict: 'A',
        link: function(scope, elm, attrs) {
            var options = scope.$eval(attrs.popDraggable); //allow options to be passed in
            console.log('this ' + elm + 'should be draggable: ' + options);
            elm.draggable(options);
        }
    };
});

angular.module('pop.toolkit').directive('dynamic', function($compile) {
    return {
        restrict: 'A',
        replace: true,
        link: function(scope, ele, attrs) {
            scope.$watch(attrs.dynamic, function(html) {
                ele.html(html);
                $compile(ele.contents())(scope);
            });
        }
    };
});
// this directive is used to track the scroll
angular.module('pop.toolkit').directive("scroll", function($window) {
    return function(scope, element, attrs) {

        angular.element($window).bind("scroll", function() {
            scope.scrollY = this.scrollTop;
            scope.scrollX = this.pageXOffset;
            scope.$apply();
        });
    };
});
// Use this directive to allow the user to scroll vertically and horizontally by dragging the mouse
// after you remove the ugly scroll bars. The directive tag needs to be placed just inside the div that controls the overflow-css;
angular.module('pop.toolkit').directive('scrollDrag', function($window) {
    return {
        scope: true,
        link: function(scope, element, attrs) {
            var x, y, top, left, down;


            $(element.parent()).mousedown(function(e) {
                e.preventDefault();
                down = true;
                // console.log(e);
                x = e.clientX;
                y = e.clientY;
                top = $(this).scrollTop();
                left = $(this).scrollLeft();
            });

            $(element.parent()).mousemove(function(e) {
                if (down) {
                    var newX = e.pageX;
                    var newY = e.pageY;

                    //console.log(y+", "+newY+", "+top+", "+(top+(newY-y)));

                    $(element.parent()).scrollTop(top - newY + y);
                    $(element.parent()).scrollLeft(left - newX + x);
                }
            });

            $('body').mouseup(function(e) {
                down = false;
            });
        }
    };
});

// DIRECTIVES
angular.module('pop.toolkit').directive('format', ['$filter', function($filter) {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function(scope, elem, attrs, ctrl) {
            if (!ctrl) {
                // console.log("returning");
                return;
            }

            var format = {
                prefix: '',
                thousandsSeparator: ''
            };

            ctrl.$parsers.unshift(function(value) {
                elem.priceFormat(format);
                // console.log(elem);
                return elem[0].value;
            });

            ctrl.$formatters.unshift(function(value) {
                elem[0].value = ctrl.$modelValue * 100;
                elem.priceFormat(format);
                // console.log(elem);
                return elem[0].value;
            });
        }
    };
}]);


//Filters


angular.module('pop.toolkit').filter('orderObjectBy', function() {
    return function(items, field, reverse) {
        var filtered = [];
        angular.forEach(items, function(item) {
            filtered.push(item);
        });

        function index(obj, i) {
            return obj[i];
        }
        filtered.sort(function(a, b) {
            var comparator;
            var reducedA = field.split('.').reduce(index, a);
            var reducedB = field.split('.').reduce(index, b);
            if (reducedA === reducedB) {
                comparator = 0;
            } else {
                comparator = (reducedA > reducedB ? 1 : -1);
            }
            return comparator;
        });
        if (reverse) {
            filtered.reverse();
        }
        return filtered;
    };
});

angular.module('pop.toolkit').filter('secondsToDateTime', [function() {
    return function(seconds) {
        return new Date(1970, 0, 1).setSeconds(seconds);
    };
}])


angular.module('pop.toolkit').filter('unique', function() {
    return function(items, filterOn) {
        if (filterOn === false) {
            return items;
        }
        if ((filterOn || angular.isUndefined(filterOn)) && angular.isArray(items)) {
            var hashCheck = {},
                newItems = [];
            var extractValueToCompare = function(item) {
                if (angular.isObject(item) && angular.isString(filterOn)) {
                    return item[filterOn];
                } else {
                    return item;
                }
            };
            angular.forEach(items, function(item) {
                var valueToCheck, isDuplicate = false;
                for (var i = 0; i < newItems.length; i++) {
                    if (angular.equals(extractValueToCompare(newItems[i]), extractValueToCompare(item))) {
                        isDuplicate = true;
                        break;
                    }
                }
                if (!isDuplicate) {
                    newItems.push(item);
                }
            });
            items = newItems;
        }
        return items;
    };
});

angular.module('pop.toolkit').filter('toArray', function() {
    return function(obj, addKey) {
        if (!obj) return obj;
        if (addKey === false) {
            return Object.keys(obj).map(function(key) {
                return obj[key];
            });
        } else {
            return Object.keys(obj).map(function(key) {
                return Object.defineProperty(obj[key], '$key', {
                    enumerable: false,
                    value: key
                });
            });
        }
    };
});

angular.module('pop.toolkit').filter('trusted', ['$sce', function($sce) {
    return function(val) {
        if (typeof val == "string") {
            return $sce.trustAsHtml(val);
        } else {
            return val;
        }
    };
}]);

angular.module('pop.toolkit').filter('chars', function() {
    return function(input, chars, breakOnWord) {
        if (isNaN(chars)) return input;
        if (chars <= 0) return '';
        if (input && input.length > chars) {
            input = input.substring(0, chars);

            if (!breakOnWord) {
                var lastspace = input.lastIndexOf(' ');
                //get last space
                if (lastspace !== -1) {
                    input = input.substr(0, lastspace);
                }
            } else {
                while (input.charAt(input.length - 1) === ' ') {
                    input = input.substr(0, input.length - 1);
                }
            }
            return input + '...';
        }
        return input;
    };
});

angular.module('pop.toolkit').filter('words', function() {
    return function(input, words) {
        if (isNaN(words)) return input;
        if (words <= 0) return '';
        if (input) {
            var inputWords = input.split(/\s+/);
            if (inputWords.length > words) {
                input = inputWords.slice(0, words).join(' ') + '...';
            }
        }
        return input;
    };
});

// FILTERS
angular.module('pop.toolkit').filter('capitalize', function() {
    return function(input, scope) {
        if (input !== null)
            input = input.toLowerCase();
        return input.substring(0, 1).toUpperCase() + input.substring(1);
    };
});


/**
 * ng-context-menu - v1.0.1 - An AngularJS directive to display a context menu
 * when a right-click event is triggered
 *
 * @author Ian Kennington Walter (http://ianvonwalter.com)
 */

angular.module('pop.toolkit').factory('ContextMenuService', function() {
    return {
        element: null,
        menuElement: null
    };
});

angular.module('pop.toolkit').directive('contextMenu', [
    '$document',
    'ContextMenuService',
    function($document, ContextMenuService) {
        return {
            restrict: 'A',
            scope: {
                'callback': '&contextMenu',
                'disabled': '&contextMenuDisabled',
                'closeCallback': '&contextMenuClose'
            },
            link: function($scope, $element, $attrs) {
                var opened = false;

                function open(event, menuElement) {
                    menuElement.addClass('open');

                    var doc = $document[0].documentElement;
                    var docLeft = (window.pageXOffset || doc.scrollLeft) -
                        (doc.clientLeft || 0),
                        docTop = (window.pageYOffset || doc.scrollTop) -
                        (doc.clientTop || 0),
                        elementWidth = menuElement[0].scrollWidth,
                        elementHeight = menuElement[0].scrollHeight;
                    var docWidth = doc.clientWidth + docLeft,
                        docHeight = doc.clientHeight + docTop,
                        totalWidth = elementWidth + event.pageX,
                        totalHeight = elementHeight + event.pageY,
                        left = Math.max(event.pageX - docLeft, 0),
                        top = Math.max(event.pageY - docTop, 0);

                    if (totalWidth > docWidth) {
                        left = left - (totalWidth - docWidth);
                    }

                    if (totalHeight > docHeight) {
                        top = top - (totalHeight - docHeight);
                    }

                    menuElement.css('top', top + 'px');
                    menuElement.css('left', left + 'px');
                    opened = true;
                }

                function close(menuElement) {
                    menuElement.removeClass('open');

                    if (opened) {
                        $scope.closeCallback();
                    }

                    opened = false;
                }

                $element.bind('contextmenu', function(event) {
                    if (!$scope.disabled()) {
                        if (ContextMenuService.menuElement !== null) {
                            close(ContextMenuService.menuElement);
                        }
                        ContextMenuService.menuElement = angular.element(
                            document.getElementById($attrs.target)
                        );
                        ContextMenuService.element = event.target;
                        //console.log('set', ContextMenuService.element);

                        event.preventDefault();
                        event.stopPropagation();
                        $scope.$apply(function() {
                            $scope.callback({
                                $event: event
                            });
                        });
                        $scope.$apply(function() {
                            open(event, ContextMenuService.menuElement);
                        });
                    }
                });

                function handleKeyUpEvent(event) {
                    //console.log('keyup');
                    if (!$scope.disabled() && opened && event.keyCode === 27) {
                        $scope.$apply(function() {
                            close(ContextMenuService.menuElement);
                        });
                    }
                }

                function handleClickEvent(event) {
                    if (!$scope.disabled() &&
                        opened &&
                        (event.button !== 2 ||
                            event.target !== ContextMenuService.element)) {
                        $scope.$apply(function() {
                            close(ContextMenuService.menuElement);
                        });
                    }
                }

                $document.bind('keyup', handleKeyUpEvent);
                // Firefox treats a right-click as a click and a contextmenu event
                // while other browsers just treat it as a contextmenu event
                $document.bind('click', handleClickEvent);
                $document.bind('contextmenu', handleClickEvent);

                $scope.$on('$destroy', function() {
                    //console.log('destroy');
                    $document.unbind('keyup', handleKeyUpEvent);
                    $document.unbind('click', handleClickEvent);
                    $document.unbind('contextmenu', handleClickEvent);
                });
            }
        };
    }
]);



// HELPER
(function($) {
    $.fn.priceFormat = function(options) {
        var defaults = {
            prefix: 'US$ ',
            suffix: '',
            centsSeparator: '.',
            thousandsSeparator: ',',
            limit: false,
            centsLimit: 2,
            clearPrefix: false,
            clearSufix: false,
            allowNegative: false,
            insertPlusSign: false
        };
        options = $.extend(defaults, options);
        return this.each(function() {
            var obj = $(this);
            var is_number = /[0-9]/;
            var prefix = options.prefix;
            var suffix = options.suffix;
            var centsSeparator = options.centsSeparator;
            var thousandsSeparator = options.thousandsSeparator;
            var limit = options.limit;
            var centsLimit = options.centsLimit;
            var clearPrefix = options.clearPrefix;
            var clearSuffix = options.clearSuffix;
            var allowNegative = options.allowNegative;
            var insertPlusSign = options.insertPlusSign;
            if (insertPlusSign) allowNegative = true;

            function to_numbers(str) {
                var formatted = '';
                for (var i = 0; i < (str.length); i++) {
                    var char_ = str.charAt(i);
                    if (formatted.length === 0 && char_ === 0) char_ = false;
                    if (char_ && char_.match(is_number)) {
                        if (limit) {
                            if (formatted.length < limit) formatted = formatted + char_;
                        } else {
                            formatted = formatted + char_;
                        }
                    }
                }
                return formatted;
            }

            function fill_with_zeroes(str) {
                while (str.length < (centsLimit + 1)) str = '0' + str;
                return str;
            }

            function price_format(str) {
                var formatted = fill_with_zeroes(to_numbers(str));
                var thousandsFormatted = '';
                var thousandsCount = 0;
                if (centsLimit === 0) {
                    centsSeparator = "";
                    centsVal = "";
                }
                var centsVal = formatted.substr(formatted.length - centsLimit, centsLimit);
                var integerVal = formatted.substr(0, formatted.length - centsLimit);
                formatted = (centsLimit === 0) ? integerVal : integerVal + centsSeparator + centsVal;
                if (thousandsSeparator || $.trim(thousandsSeparator) !== "") {
                    for (var j = integerVal.length; j > 0; j--) {
                        char_ = integerVal.substr(j - 1, 1);
                        thousandsCount++;
                        if (thousandsCount % 3 === 0) char_ = thousandsSeparator + char_;
                        thousandsFormatted = char_ + thousandsFormatted;
                    }
                    if (thousandsFormatted.substr(0, 1) == thousandsSeparator) thousandsFormatted = thousandsFormatted.substring(1, thousandsFormatted.length);
                    formatted = (centsLimit === 0) ? thousandsFormatted : thousandsFormatted + centsSeparator + centsVal;
                }
                if (allowNegative && (integerVal !== 0 || centsVal !== 0)) {
                    if (str.indexOf('-') != -1 && str.indexOf('+') < str.indexOf('-')) {
                        formatted = '-' + formatted;
                    } else {
                        if (!insertPlusSign) formatted = '' + formatted;
                        else formatted = '+' + formatted;
                    }
                }
                if (prefix) formatted = prefix + formatted;
                if (suffix) formatted = formatted + suffix;
                return formatted;
            }

            function key_check(e) {
                var code = (e.keyCode ? e.keyCode : e.which);
                var typed = String.fromCharCode(code);
                var functional = false;
                var str = obj.val();
                var newValue = price_format(str + typed);
                if ((code >= 48 && code <= 57) || (code >= 96 && code <= 105)) functional = true;
                if (code == 8) functional = true;
                if (code == 9) functional = true;
                if (code == 13) functional = true;
                if (code == 46) functional = true;
                if (code == 37) functional = true;
                if (code == 39) functional = true;
                if (allowNegative && (code == 189 || code == 109)) functional = true;
                if (insertPlusSign && (code == 187 || code == 107)) functional = true;
                if (!functional) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (str != newValue) obj.val(newValue);
                }
            }

            function price_it() {
                var str = obj.val();
                var price = price_format(str);
                if (str != price) obj.val(price);
            }

            function add_prefix() {
                var val = obj.val();
                obj.val(prefix + val);
            }

            function add_suffix() {
                var val = obj.val();
                obj.val(val + suffix);
            }

            function clear_prefix() {
                if ($.trim(prefix) !== '' && clearPrefix) {
                    var array = obj.val().split(prefix);
                    obj.val(array[1]);
                }
            }

            function clear_suffix() {
                if ($.trim(suffix) !== '' && clearSuffix) {
                    var array = obj.val().split(suffix);
                    obj.val(array[0]);
                }
            }
            $(this).bind('keydown.price_format', key_check);
            $(this).bind('keyup.price_format', price_it);
            $(this).bind('focusout.price_format', price_it);
            if (clearPrefix) {
                $(this).bind('focusout.price_format', function() {
                    clear_prefix();
                });
                $(this).bind('focusin.price_format', function() {
                    add_prefix();
                });
            }
            if (clearSuffix) {
                $(this).bind('focusout.price_format', function() {
                    clear_suffix();
                });
                $(this).bind('focusin.price_format', function() {
                    add_suffix();
                });
            }
            if ($(this).val().length > 0) {
                price_it();
                clear_prefix();
                clear_suffix();
            }
        });
    };
    $.fn.unpriceFormat = function() {
        return $(this).unbind(".price_format");
    };
    $.fn.unmask = function() {
        var field = $(this).val();
        var result = "";
        for (var f in field) {
            if (!isNaN(field[f]) || field[f] == "-") result += field[f];
        }
        return result;
    };
})(jQuery);
