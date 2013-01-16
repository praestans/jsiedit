jsiedit_fn_sample_habr_parse = function(elem, keep_format)
{
	keep_format = keep_format || false;
	var html = '';
	var node;
	var txt = '';
	var pre = '';
	var post = '';
	var j;
	var str = '';

	switch (elem.nodeName)
	{
		case '#text':
			txt = elem.nodeValue;
			if (!keep_format)
			{
				txt = txt.replace(/\t/g, ' ');
				txt = txt.replace(/\s+/g, ' ');
				txt = txt.replace(/&/g, '&amp;');
				txt = txt.replace(/</g, '&lt;');
				txt = txt.replace(/>/g, '&gt;');
			}
			else
			{
//				txt = txt.replace(/<([\/a-zA-Z])/g, '&lt;$1');
				txt = txt.replace(/<br/g, '&lt;br');
			}
			break;
		case 'HR':
			txt = '<hr />';
			break;
		case 'BR':
			txt = '\n';
			break;
		case 'STRONG': 
		case 'EM': 
		case 'STRIKE': 
		case 'U': 
		case 'I': 
		case 'SUP':
		case 'SUB':
		case 'H1': 
		case 'H2': 
		case 'H3': 
		case 'H4': 
		case 'H5': 
		case 'H6': 
		case 'TABLE':
		case 'TH':
		case 'TD':
		case 'TR':
		case 'BLOCKQUOTE':
			pre = '<' + elem.nodeName + '>';
			post = '</' + elem.nodeName + '>';
			break;
		case 'B': 
			if (elem.className == 'spoiler_title')
			{
				pre = '<SPOILER title="';
				post = '">';
			}
			else 		
			{
				pre = '<' + elem.nodeName + '>';
				post = '</' + elem.nodeName + '>';
			}
			break;
		case 'A': 
			if (elem.className == 'user_link')
			{
				pre = '<hh user="';
				post = '" />';
			}
			else if (elem.name)
			{
				pre = '<ANCHOR>';
				txt = elem.name;
				post = '</ANCHOR>';
			}
			else
			{
				pre = '<A HREF="' + elem.href + '">';
				post = '</A>';
			}
			break;
		case 'IMG': 
			pre = '<img src="' + elem.src + '" />';
			break;
		case 'UL':
			pre = '<UL>';
			post = '</UL>';
			break;
		case 'OL':
			pre = '<OL';
			if (elem.start && (elem.start != 1))
				pre += ' start="' + elem.start + '"';
			if (elem.type && (elem.type != '1'))
				pre += ' type="' + elem.type + '"';
			pre += '>';
			post = '</OL>';
			break;
		case 'LI':
			pre = '<LI>';
			post = '</LI>\n';
			break;
		case 'CODE':
			pre = '<source';
			str = elem.className.split(' ', 1)[0];
			if (str != '')
			{
				pre += ' lang="' + str + '"';
			}
			pre += '>';
			post = '</source>';
			break;
		case 'HABRACUT':
			pre = '<habracut ';
			if (elem.getAttribute("text"))
			{
				pre += 'text="' + elem.getAttribute("text") + '" ';
			}
			pre += '/>';
			post = '';
			break;
		case 'DIV':
			if (elem.className == 'spoiler_text')
			{
				post = '</SPOILER>';
			}
			break;
	}

	html = html + pre + txt;
	for (j  = 0; j < elem.childNodes.length; j++)
	{
		node = elem.childNodes[j];
	
		if (elem.nodeName == 'PRE')
		{
			if (node.nodeName == 'CODE')
			{
				html = html + jsiedit_fn_sample_habr_parse(node, true);
			}
			else
			{
				html = html + '<PRE>' + jsiedit_fn_sample_habr_parse(node, true) + '</PRE>';
			}
		}
		else
		{
			html = html + jsiedit_fn_sample_habr_parse(node, keep_format);
		}
	}
	html = html + post;
	return html;
};

jsiedit_fn_sample_habr_produce = function(src)
{
	var fn_source = function(s)
	{
		var res = s.match(/^<source\s+lang=([^>]*)>([\s\S]*)<\/source>$/i);
		if (res)
			return '<pre><code class=' + res[1] + '>' + res[2].replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</code></pre>';
		res = s.match(/^<source>([\s\S]*)<\/source>$/i);
		if (res)
			return '<pre><code>' + res[1].replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</code></pre>';
		
		res = s.match(/^<pre>([\s\S]*)<\/pre>$/i);
		if (res)
			return '<pre>' + res[1].replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</pre>';
		return s.replace(/</g,'&lt;').replace(/>/g,'&gt;');
	};

	var rep = [
		[/(<source\s([\s\S])*?<\/source>)|(<source>([\s\S])*?<\/source>)|(<pre>([\s\S])*?<\/pre>)/gi, fn_source],
		[/<anchor>([^<]*)<\/anchor>/gi, '<a name="$1"></a>'],
		[/\n/g, '<br>'],
		[/<hh\s+user=['"]([^'"]+)['"]\s*\/>/gi, '<a href="http://habrahabr.ru/users/$1/" class="user_link">$1</a>'],
		[/<spoiler\s+title=['"]([^'"]+)['"]>/gi, '<div class="spoiler"><b class="spoiler_title">$1<\/b><div class="spoiler_text">'],
		[/<\/spoiler>/gi, '</div></div>']
	];

	var str = src;
	var i;
	for (i = 0; i < rep.length; i++ )
	{
		str = str.replace(rep[i][0], rep[i][1]);
	}
	return str;
};

jsiedit_fn_sample_habr_check_node = function(node)
{
	switch (node.tagName)
	{
		case 'BR':
			return [false, false, false, true];
		case 'DIV':
			if (node.className == 'content html_format')
				return [true, false, true, true];
	}
	return false;
};

jsiedit_fn_get_bounds = function(fn_check_node)
{
	var sel = window.getSelection();	// Получим выделенный блок
	
	if (!(typeof sel === 'undefined'))	// Проверим, что что-то было выделено
	{
		if (sel.rangeCount == 1)	// Нас не интересуют множественные выделения
		{
			var rng = sel.getRangeAt(0);	// Получим range выделенного блока
			var prnt = rng.commonAncestorContainer; // Это ближайший общий предок
			var sc = rng.startContainer; // Это "начало" выделения
			var ec = rng.endContainer; // Это "конец" выделения

			if ((prnt.tagName == 'DIV') || (prnt.tagName == 'SPAN'))
			{
				if (prnt == sc)
					sc = prnt.childNodes.item(rng.startOffset);
				if (prnt == ec)
					ec = prnt.childNodes.item(rng.endOffset);
			}			
			
			var chk = fn_check_node(prnt);
			var include_bounds = [true, true];	// Следует ли включить границы
			
			if (chk && chk[2] && (sc != prnt) && (ec != prnt))	//	Надо поднять границы до уровня предка, будем искать пока не станут братьями
			{
				while (sc.parentNode != prnt)
				{
					sc = sc.parentNode;
				}

				while (ec.parentNode != prnt)
				{
					ec = ec.parentNode;
				}
			}
			else if (chk && chk[0])	// Сам предок может быть включен, добавляем
			{
				return [prnt, chk[1]];
			}
			else	// Необходимо найти предка, которого получится включить
			{
				while (prnt.parentNode)
				{
					chk = fn_check_node(prnt.parentNode);
					if (chk && chk[2])
					{
						sc = prnt;
						ec = prnt;
						prnt = prnt.parentNode;
						break;
					}
					else if (chk && chk[0])
					{
						return [prnt.parentNode, chk[1]];
					}
					prnt = prnt.parentNode;
					if (!prnt.parentNode)
						return false;
				}				
			}
			
			chk = fn_check_node(sc);
			if (chk && chk[0])	// Узел может быть выбран самостоятельно
			{
			}
			else
			{
				while (sc.previousSibling)	//	Есть "младший" брат
				{
					sc = sc.previousSibling;
					chk = fn_check_node(sc);
					
					if (chk && chk[3])
					{
						include_bounds[0] = chk[1];	// Надо ли включать сам объект
						break;
					}
				}
			}
			
			chk = fn_check_node(ec);
			if (chk && chk[0])	// Узел может быть выбран самостоятельно
			{
			}
			else
			{
				while (ec.nextSibling)	//	Есть "младший" брат
				{
					ec = ec.nextSibling;
					chk = fn_check_node(ec);
					
					if (chk && chk[3])
					{
						include_bounds[1] = chk[1];	// Надо ли включать сам объект
						break;
					}
				}
			}
			return [sc, ec, include_bounds[0], include_bounds[1]];
		}
	}
	return false;
};

jsiedit_fn_editor_cancel = function()
{
	jsiedit.editor.parentNode.insertBefore(jsiedit.rng, jsiedit.editor.nextSibling); // Восстановим range после редактора
	jsiedit.editor.parentNode.removeChild(jsiedit.editor);	// Удалим редактор
	jsiedit.editor = false;
	jsiedit.state = 'hidden';
};

jsiedit_fn_sample_habr_editor_save = function()
{
	var div = document.createElement('div');
	div.innerHTML = jsiedit.fn_produce(jsiedit.editor.childNodes.item(0).value);
	var rng = document.createRange();
	rng.selectNodeContents(div);
	jsiedit.editor.parentNode.insertBefore(rng.extractContents(), jsiedit.editor.nextSibling); // Восстановим range после редактора
	jsiedit.editor.parentNode.removeChild(jsiedit.editor);	// Удалим редактор
	jsiedit.editor = false;
	jsiedit.state = 'hidden';
	
	
// <div id="preview_placeholder" class="">
	// <div id="post_" class="post shortcuts_item">
		// <div class="published"></div>
		// <h1 class="title"></h1>
		// <div class="content html_format"></div>
		// <ul class="tags"></ul>
		// <div id="infopanel_post_" class="infopanel"></div>
		// <div class="clear"></div>
	// </div>	
// </div>	


// <div id="preview_placeholder" class="">
	// <div id="post_0" class="post shortcuts_item">
		// <div class="published"></div>
		// <h1 class="title"></h1>
		// <div class="hubs"></div>
		// <div class="content html_format"></div>
		// <ul class="tags"></ul>
		// <div id="infopanel_post_0" class="infopanel"></div>
		// <div class="clear"></div>
	// </div>
// </div>

// <textarea cols="30" rows="7" id="text_textarea" name="text"></textarea>
	
	rng = document.createRange();
	
	div = document.getElementById('post_');
	if (!div)
	{
		div = document.getElementById('post_0');
	}
	
	if (div)
	{
		for (var i = 0; i < div.childNodes.length; i++)
		{
			if (div.childNodes.item(i).className == "content html_format")
			{
				div = div.childNodes.item(i);
				rng.selectNodeContents(div);
				var str = jsiedit.fn_parse(rng.cloneContents());
				
				div = document.getElementById('text_textarea');
				if (div)
				{
					div.value = str;
				}
				break;
			}        
		}
	}
};


jsiedit_fn_mouseup = function(event)
{
	if (jsiedit.state == 'editor')
		return;
	var hd = true;
	var sel = window.getSelection();	// Получим выделенный блок
	if (!(typeof sel === 'undefined'))	// Проверим, что что-то было выделено
	{
		if (sel.getRangeAt(0).toString().length > 0)
		{
			hd = false;
		}
	}
	
	if (hd)
	{
		if (jsiedit.btn)
		{
			jsiedit.state = 'hidden';
			jsiedit.btn.style.visibility = 'hidden';
		}
	}
	else
	{
		switch (jsiedit.state)
		{
			case 'initial':
				jsiedit.btn = document.createElement('input');
				jsiedit.btn.type = 'button';
				jsiedit.btn.value = 'Edit';
				jsiedit.btn.style.position = 'absolute';
				jsiedit.btn.style.top      = event.pageY + 'px';
				jsiedit.btn.style.left     = event.pageX + 'px';
				jsiedit.btn.style.visibility = 'visible';
				jsiedit.btn.disabled = false;
				jsiedit.btn.onclick = jsiedit.fn_editor_start;
				document.body.appendChild(jsiedit.btn);
				jsiedit.state = 'visible';	
				break;
			case 'hidden':
				jsiedit.btn.style.visibility = 'visible';
				jsiedit.state = 'visible';	
				jsiedit.btn.disabled = false;
				jsiedit.btn.style.top      = event.pageY + 'px';
				jsiedit.btn.style.left     = event.pageX + 'px';
				break;
			case 'visible':
				jsiedit.btn.style.visibility = 'visible';
				jsiedit.btn.disabled = false;
				jsiedit.btn.style.top      = event.pageY + 'px';
				jsiedit.btn.style.left     = event.pageX + 'px';
				break;
			case '':
				break;
		}
	}
};

jsiedit_fn_editor_start = function()
{
	jsiedit.btn.style.visibility = 'hidden';
	jsiedit.state = 'editor';
	var bounds = jsiedit.fn_get_bounds(jsiedit.fn_check_node);
	if (bounds)
	{
		var rng_new = document.createRange();
		if (bounds.length == 2)
		{
			if (bounds[1])
				rng_new.selectNode(bounds[0]);
			else
				rng_new.selectNodeContents(bounds[0]);
		}
		else
		{
			if (bounds[2])
				rng_new.setStartBefore(bounds[0]);
			else
				rng_new.setStartAfter(bounds[0]);
			if (bounds[3])
				rng_new.setEndBefore(bounds[1]);
			else
				rng_new.setEndAfter(bounds[1]);
		}
		jsiedit.editor = document.createElement('div');
		var tarea = document.createElement('textarea');  // Создаём область для редактирования
		tarea.style.resize = 'both';	// Разрешим изменение размера по вертикали
		tarea.value = jsiedit.fn_parse(rng_new.cloneContents()); // Получим текст для редактирования
		var rect = rng_new.getBoundingClientRect();
		tarea.style.width = Math.max(100, (bounds[0].parentNode.clientWidth - 10)) + 'px'; // Установим ширину редактора
		tarea.style.height = Math.max(50, Math.min(window.innerHeight / 2, rect.height)) + 'px'; // Зададим высоту редактора
		jsiedit.editor.appendChild(tarea);
		var btn1 = document.createElement('input');
		btn1.type = 'button';
		btn1.value = 'Save';
		btn1.onclick = jsiedit.fn_editor_save;
		jsiedit.editor.appendChild(btn1);
		var btn2 = document.createElement('input');
		btn2.type = 'button';
		btn2.value = 'Cancel';
		btn2.onclick = jsiedit.fn_editor_cancel;
		jsiedit.editor.appendChild(btn2);

		if (bounds.length == 2)
		{
			if (bounds[1])
			{
				bounds[0].parentNode.insertBefore(jsiedit.editor, bounds[0].nextSibling); // Добавим редактор после области
			}
			else
			{
				bounds[0].appendChild(jsiedit.editor);
			}
		}
		else
		{
			bounds[1].parentNode.insertBefore(jsiedit.editor, bounds[1].nextSibling); // Добавим редактор после области
		}
		jsiedit.rng = rng_new.extractContents();	// Сохраним содержимое для восстановления при отмене редактирования
	}
	return false;
};

jsiedit_fn_init = function()
{
	document.body.addEventListener("mouseup", jsiedit.fn_mouseup, false);
};


//	document.addEventListener("DOMContentLoaded", jsiedit.fn_init, false);

var jsiedit = new function()
{
	this.state  = 'initial';
	this.btn    = false;
	this.editor = false;
	this.rng    = false;
//	Получение границ выделения - ядро jsiedit	
	this.fn_get_bounds    = jsiedit_fn_get_bounds;
//	Привязка вызова редактора к отпусканию кнопки мыши	
	this.fn_init          = jsiedit_fn_init;
//	Обработчик мыши, универсальный
	this.fn_mouseup       = jsiedit_fn_mouseup;
//	Запуск редактора, универсальный	
	this.fn_editor_start  = jsiedit_fn_editor_start;
//	Отмена редактирования, универсальная	
	this.fn_editor_cancel = jsiedit_fn_editor_cancel;

//	Проверка узла, необходимо уточнять для конкретного сайта	
	this.fn_check_node    = jsiedit_fn_sample_habr_check_node;
//	Преобразование HTML кода в язык разметки, должен настраиваться	
	this.fn_parse         = jsiedit_fn_sample_habr_parse;
//	Сохранение, необходимо настраивать под конкретный сайт	
	this.fn_editor_save   = jsiedit_fn_sample_habr_editor_save;
//	Преобразование языка разметки в HTML код, используется лишь в this.fn_editor_save	
	this.fn_produce       = jsiedit_fn_sample_habr_produce;
};

jsiedit.fn_init();