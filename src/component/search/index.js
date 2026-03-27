import { data } from '../data';
import { state } from '../state';
import { bookmark } from '../bookmark';
import { groupAndBookmark } from '../groupAndBookmark';
import { searchEnginePreset } from '../searchEnginePreset';


import { Button } from '../button';
import { Control_text } from '../control/text';

import { node } from '../../utility/node';
import { trimString } from '../../utility/trimString';
import { isValidString } from '../../utility/isValidString';

import './index.css';

export const Search = function () {

  this.element = {
    search: node('div|class:search'),
    form: node('form|class:search-form,action,method:get'),
    submit: node('input|type:submit,value:Search,class:is-hidden'),
    input: new Control_text({
      object: state.get.current(),
      path: 'header.search.string',
      id: 'header-search-string',
      value: '',
      placeholder: 'Search Bookmarks or',
      labelText: 'Search',
      classList: ['search-input'],
      srOnly: true,
      action: () => {
        this.state();
        this.performSearch();
      }
    }),
    clear: new Button({
      text: 'Clear search',
      srOnly: true,
      iconName: 'cross',
      style: ['link', 'line'],
      title: 'Clear search',
      classList: ['search-clear'],
      func: () => {
        this.element.input.text.value = '';
        this.state();
        this.performSearch();
      }
    })
  };

  this.state = () => {

    if (isValidString(trimString(this.element.input.text.value))) {

      state.get.current().search = true;

    } else {

      state.get.current().search = false;

    }

    data.save();

  };

  this.placeholder = () => {

    let placeholder = '';

    if (state.get.current().bookmark.show) {
      placeholder = 'Find bookmarks or search';
    } else {
      placeholder = 'Search';
    }

    switch (state.get.current().header.search.engine.selected) {

      case 'custom':

        if (isValidString(state.get.current().header.search.engine.custom.name)) {

          placeholder = placeholder + ' ' + state.get.current().header.search.engine.custom.name;

        }

        break;

      default:

        placeholder = placeholder + ' ' + searchEnginePreset[state.get.current().header.search.engine.selected].name;

        break;

    }

    this.element.input.text.placeholder = placeholder;

  };

  this.engine = {};

    this.engine.set = () => {
    const current = state.get.current();
    const isCustom = current.header.search.engine.selected === 'custom';

    if (isCustom) {
      const customUrl = current.header.search.engine.custom.url;
      // 如果发现 URL 里包含 %s，说明是复杂 URL，我们取消表单的默认 action 提交
      if (customUrl.includes('%s')) {
        this.element.form.setAttribute('action', '#'); 
        this.element.input.text.name = ''; 
      } else {
        // 传统的简单 URL (如 google.com/search)
        this.element.input.text.name = current.header.search.engine.custom.queryName || 'q';
        this.element.form.setAttribute('action', customUrl);
      }
    } else {
      // 预设引擎逻辑
      this.element.input.text.name = 'q';
      this.element.form.setAttribute('action', searchEnginePreset[current.header.search.engine.selected].url);
    }

    if (current.header.search.newTab) {
      this.element.form.setAttribute('target', '_blank');
    }
  };

  // this.engine.set = () => {

  //   switch (state.get.current().header.search.engine.selected) {

  //     case 'custom':

  //       if (isValidString(state.get.current().header.search.engine.custom.queryName) && isValidString(state.get.current().header.search.engine.custom.url)) {

  //         this.element.input.text.name = state.get.current().header.search.engine.custom.queryName;

  //         this.element.form.setAttribute('action', state.get.current().header.search.engine.custom.url);

  //       } else {

  //         this.element.input.text.name = '';

  //         this.element.form.setAttribute('action', '');

  //       }

  //       break;

  //     default:

  //       this.element.input.text.name = 'q';

  //       this.element.form.setAttribute('action', searchEnginePreset[state.get.current().header.search.engine.selected].url);

  //       break;

  //   }

    if (state.get.current().header.search.newTab) {
      this.element.form.setAttribute('target', '_blank');
    }

  };

  this.engine.bind = () => {
    this.element.input.addEventListener();
  };

  this.performSearch = () => {

    const html = document.querySelector('html');

    if (state.get.current().search) {

      html.classList.add('is-search');

      const searchString = trimString(this.element.input.text.value).toLowerCase();

      bookmark.all.forEach((item) => {

        item.items.forEach((item) => {

          item.searchMatch = false;

          let matchUrl = isValidString(item.url) && item.url.toLowerCase().includes(searchString);

          let matchName = isValidString(item.display.name.text) && trimString(item.display.name.text).toLowerCase().includes(searchString);

          if (matchUrl || matchName) {
            item.searchMatch = true;
          }

        });

      });

    } else {

      html.classList.remove('is-search');

      this.clearSearch();

    }

    groupAndBookmark.render();

  };

  this.clearSearch = () => {

    bookmark.all.forEach((item) => {

      item.items.forEach((item) => {

        delete item.searchMatch;

      });

    });

    data.save();

  };

  this.assemble = () => {

    this.element.input.text.type = 'Search';

    this.element.form.appendChild(this.element.input.text);

    this.element.form.appendChild(this.element.submit);

    this.element.form.appendChild(this.element.clear.button);

    this.element.search.appendChild(this.element.form);
    
        // 拦截回车提交事件
    this.element.form.addEventListener('submit', (e) => {
      const current = state.get.current();
      const customUrl = current.header.search.engine.custom.url;
      const query = this.element.input.text.value;

      // 如果是自定义引擎且带有 %s 占位符
      if (current.header.search.engine.selected === 'custom' && customUrl.includes('%s')) {
        e.preventDefault(); // 阻止原生的表单提交
        
        // 核心逻辑：替换 %s 并手动编码
        const finalUrl = customUrl.replace('%s', encodeURIComponent(query));
        
        if (current.header.search.newTab) {
          window.open(finalUrl, '_blank');
        } else {
          window.location.href = finalUrl;
        }
      }
    });

  };

  this.search = () => {

    return this.element.search;

  };

  this.resultCount = () => {

    const count = { total: 0, group: [] };

    bookmark.all.forEach((item, i) => {

      count.group.push({
        bookmarkCount: item.items.length,
        searchMatch: 0
      });

      const groupIndex = i;

      item.items.forEach((item) => {

        if (item.searchMatch) { count.group[groupIndex].searchMatch++; }

      });

      count.total = count.total + count.group[groupIndex].searchMatch;

    });

    return count;

  };

  this.update = {};

  this.update.style = () => {

    const html = document.querySelector('html');

    if (state.get.current().theme.header.search.opacity < 40) {

      html.classList.add('is-header-search-opacity-low');

    } else {

      html.classList.remove('is-header-search-opacity-low');

    }

  };

  this.assemble();

  this.placeholder();

  this.engine.set();

  this.clearSearch();

  this.update.style();

};
