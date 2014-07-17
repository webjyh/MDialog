/**
 * M.Dialog 1.0.0
 * Date: 2014-07-10
 * (c) 2014-2014 M.J, http://webjyh.com
 *
 * This is licensed under the GNU LGPL, version 2.1 or later.
 * For details, see: http://creativecommons.org/licenses/LGPL/2.1/
 *
 */
(function( window ){

	//传入 window 全局变量进来
	//使全局变量变成局部变量，使得查找变量更快
	//方便代码压缩，从而不影响使用
	var win = window;
	var document = win.document;

	//构造函数，使得每次初始化不需要使用 new
	var MDialog = function( options ){
		return new MDialog.fn.init( options );
	};

	MDialog.version = '1.0.0';

	//扩展原型，使上面返回的 new 对象 继承以下方法和属性。
	MDialog.fn = MDialog.prototype = {

		/**
		 * @access   Public
		 * @name     初始化插件
		 * @param    options     {Object}     插件参数
		 * @return   {this}
		 */
		init: function( options ){
			var DOM, elem;

			//全局
			//this.closeBoolean 修正多处关闭事件从而导致的问题
			//this.top 修正IE下 FixedEvent Top 值问题
			this.IE6 = !-[1,] && !win.XMLHttpRequest;
			this.closeBoolean = false;
			this.top = null;

			//默认配置项合并
			this.config = this._cover( options, MDialog.defaults );
			( win.MDialog.zIndex >= this.config.zIndex ) ? win.MDialog.zIndex = win.MDialog.zIndex + 2 : win.MDialog.zIndex = this.config.zIndex;

			//检测是否重复设置弹窗ID
			if ( this.config.id ){
				elem = document.getElementById( this.config.id );
				if ( elem ){
					return false;
				}
			}

			//创建 MDialog Element
			this.DOM = DOM = this._createDOM();
			if ( this.config.lock ) this._createLock();

			//设置CSS
			DOM._body()._css({ 'width': this.config.width, 'height': this.config.height });
			DOM._content()._padding( this.config.padding );
			DOM._footer()._hide();
			DOM._title()._css( 'cursor', this.config.drag ? 'move' : 'auto' );

			//初始化
			this
			    ._title( this.config.title )
			    ._content( this.config.content )
			    ._statusbar( this.config.statusbar )
			    ._button( this.config.button )
			    ._position( this.config.top, this.config.left )
			    ._addEvent();

			//弹窗初始化后的回调函数
			if ( typeof this.config.init == 'function' ) this.config.init.call( this );

		},

		/**
		 * @access    Public
		 * @name      设置标题文字 并调整弹窗位置
		 * @param     text     {String}     设置标题
		 * @return    {this}
		 */
		title: function( text ){
		 	this._title( text );
		 	this._position( this.config.top, this.config.left, true );
		 	return this;
		},

		/**
		 * @access    Public
		 * @name      设置弹窗内容 并调整弹窗位置
		 * @param     {Element}       设置内容
		 * @return    {this}
		 */
		content: function( msg ){
		 	this._content( msg );
		 	this._position( this.config.top, this.config.left, true );
		 	return this;
		},

		/**
		 * @access    Public
		 * @name      对话框左下脚添加复选框 并调整弹窗位置
		 * @param     {Element}       设置内容
		 * @return    {this}
		 */
		statusbar: function( msg ){
			this._statusbar( msg );
			this._position( this.config.top, this.config.left, true );
		 	return this;
		},

		/**
		 * @access    Public
		 * @name      设置自动关闭弹窗
		 * @example   {time}       {int}
		 * @return    {this}
		 */
		time: function( time ){
			var _this = this;
			setTimeout( function(){ _this._closeEvent( _this.config.close ); }, time * 1000 );
			return this;
		},

		/**
		 * @access    Public
		 * @name      关闭弹窗对外接口
		 * @example   this.close();
		 * @return    {this}
		 */
		close: function( callback ){
			if ( typeof callback == 'function' ){
				this.config.close = callback;
			}
			this._closeEvent( this.config.close );
			return this;
		},

		/**
		 * @access    Public
		 * @name      增加锁屏
		 * @example   this.lock();
		 * @return    {this}
		 */
		lock: function(){
			var DOM = this.DOM,
				_this = this;
			if ( !this.config.lock ){
				this.config.lock = true;
				this._createLock();
				DOM._lock()._bind('dblclick', function(){ _this._closeEvent( _this.config.close ); });
			}
			return this;
		},

		/**
		 * @access    Public
		 * @name      解除锁屏
		 * @example   this.unlock();
		 * @return    {this}
		 */
		unlock: function(){
			var DOM = this.DOM;
			if ( this.config.lock ){
				if ( this.config.lock ) document.body.removeChild( DOM._lock()[0] );
				this.config.lock = false;
			}
			return this;
		},

		/**
		 * @access    Public
		 * @name      设置容器宽度,并重新调整弹窗位置
		 * @example   this.width( 300 || '20em' );
		 * @return    {this}
		 */
		width: function( val ){
			this._size( 'width', val );
			return this;
		},

		/**
		 * @access    Public
		 * @name      设置容器高度,并重新调整弹窗位置
		 * @example   this.height( 300 || '20em' );
		 * @return    {this}
		 */
		height: function( val ){
			this._size( 'height', val );
			return this;
		},

		/**
		 * @access    Public
		 * @name      设置容器padding，并重新调整弹窗位置
		 * @example   this.padding( 0 || '10px 20px' );
		 * @return    {this}
		 */
		padding: function( val ){
			var DOM = this.DOM;
			DOM._content()._padding( val );
			this._position( this.config.top, this.config.left, true );
			return this;
		},

		/**
		 * @access    Public
		 * @name      设置弹窗 top, left 位置
		 * @example   this.left( 100, 100 );
		 * @return    {this}
		 */
		position: function( top, left ){
			var _top, _left;
			_top = ( typeof top == 'number' ) ? top + 'px' : top;
			_left = ( typeof left == 'number' ) ? left + 'px' : left;

			this.config.top = _top;
			this.config.left = _left;

			this._position( this.config.top, this.config.left, true );
			return this;
		},

		/**
		 * @access    Public
		 * @name      增加一个新的按钮, 并调整位置
		 * @example   this.button( [{name:'按钮文字', callback:function(){ console.log('按下执行的函数') }, focus:true, disabled:true }] );
		 * @return    {this}
		 */
		button: function( arr ){
			if ( this._isArray( arr ) ){
				this._button( arr );
				this._position( this.config.top, this.config.left, true );
			}
			return this;
		},

		/**
		 * @access    Private
		 * @name      将默认配置和选项合并
		 * @param     options     {Object}     默认用户的参数
		 * @return    {Object}
		 */
		_cover: function( options, defaults ){
			var i, options = options || {};
			for ( i in defaults ){
				if ( options[i] === undefined ) options[i] = defaults[i];
			}
			return options;
		},

		/**
		 * @access    Private
		 * @name      设置标题文字
		 * @param     text     {String}
		 * @return    {this}
		 */
		_title: function( text ){
			var DOM = this.DOM;
		 	DOM._title()._text( text );
		 	return this;
		},

		/**
		 * @access    Private
		 * @name      设置弹窗内容
		 * @param     {msg}     {Element}
		 * @return    {this}
		 */
		_content: function( msg ){
		 	var DOM = this.DOM;
		 	DOM._content()._html( msg );
		 	return this;
		},

		/**
		 * @access    Private
		 * @name      对话框左下脚添加复选框
		 * @param     {Element}       设置内容
		 * @return    {this}
		 */
		_statusbar: function( msg ){
			var DOM = this.DOM;
			if ( msg != null ){
				DOM._footer()._show();
			 	DOM._statusbar()._html( msg );
		 	}
		 	return this;
		},

		/**
		 * @access    Private
		 * @name      设置弹窗按钮
		 * @param     {arr}     {Array} 
		 * @return    {this}
		 */
		_button: function( arr ){
			var _arr = arr || [],
			    _obj = ['name', 'callback', 'focus', 'disabled'];

			var getObj = function( arr ){
				var obj = {};
				for ( var i=0; i<_obj.length; i++ ){
					obj[_obj[i]] = arr[i];
				}
				return obj;
			};

			if ( this.config.cancel != null ){
				_arr.unshift( getObj( [this.config.cancelVal, this.config.cancel, false, false ]) );
			}

			if ( this.config.ok != null ){
				_arr.unshift( getObj( [this.config.okVal, this.config.ok, true, false ]) );
			}

			this._createButton( _arr );

			return this;
		},

		/**
		 * @access    Private
		 * @name      绑定元素事件
		 * @param     event
		 * @return    {this}
		 */
		_addEvent: function(){
			var DOM = this.DOM,
			    _this = this,
			    _domElem = this._sizzle( document ),
			    _winElem = this._sizzle( win );
			
			//关闭弹窗事件
			DOM._close()._bind('click', function(){ _this._closeEvent( _this.config.close ); });
			if ( this.config.lock ) DOM._lock()._bind('dblclick', function(){ _this._closeEvent( _this.config.close ); });

			//IE6 下Fixed 定位问题
			if ( this.config.fixed && this.IE6 ){
				_winElem()._bind( 'scroll', function(){ _this._fixedEvent(); });
			}

			//设置焦点事件
			DOM._wrap()._bind('mousedown', function(){ _this._focusEvent(); });
			DOM._header()._bind('mousedown', function(){ DOM._wrap()._addClass( 'ui-dialog-focus' ); });
			DOM._wrap()._bind('mouseup', function(){ DOM._wrap()._removeClass( 'ui-dialog-focus' ); });

			//自动关闭弹窗
			if ( this.config.time ){
				this.time( this.config.time );
			}
			
			//绑定ESC键盘事件
			if ( this.config.esc ){
				_domElem()._bind( 'keydown', function( event ){
					var event = event || window.event,
						which = event.which || event.keyCode;

					if ( which == 27 ){
						_this._closeEvent( _this.config.close );
					}
				});
			}

			//绑定resize事件
			if ( this.config.resize ) _winElem()._bind( 'resize', function(){ _this._resize(); } );

			//绑定拖拽事件
			if ( this.config.drag ) this._drag();

			return this;

		},

		/**
		 * @access   Private
		 * @name     将 Templates 插入到 DOM 中，并将元素保存在DOM中。
		 * @param    {Null}
		 * @return   {this}
		 */
		_createDOM: function(){
			var tpl = document.createElement('div');
			
			//TPL 操作
			tpl.innerHTML = MDialog.templates;
			tpl.className = 'ui-dialog-wrap';
			if ( this.config.id ) tpl.setAttribute( 'id', this.config.id );
			
			document.body.appendChild(tpl);
			
			var DOM = { _wrap : this._sizzle( tpl ) },
			    i = 0,
			    elem = tpl.getElementsByTagName('*');
			    elemLen = elem.length;
			
			//遍历 TPL 所有元素，取得所需的元素
			for ( ; i < elemLen; i++ ){
				var name = elem[i].className.replace('ui-dialog-', '');
				if ( name ) DOM['_'+name] = this._sizzle( elem[i] );
			}

			return DOM;
		},

		/**
		 * @access   Private
		 * @name     创建锁屏，并将元素添加到DOM中
		 * @param    {Null}
		 * @return   {this}
		 */
		_createLock: function(){
			var DOM = this.DOM,
			    tpl = document.createElement('div'),
			    winHeight = document.documentElement.clientHeight,
			    bodyHeight = document.documentElement.scrollHeight,
			    height = ( winHeight > bodyHeight ) ? winHeight + 'px' : bodyHeight + 'px',
			    IE6Select = '<iframe style="position:absolute;width:100%;height:100%;_filter:alpha(opacity=0);opacity=0;"></iframe>',
			    index = win.MDialog.zIndex - 1;

			tpl.className = 'ui-dialog-lock';
			if ( this.IE6 ) tpl.innerHTML = IE6Select;

			document.body.appendChild( tpl );
			DOM._lock = this._sizzle( tpl );

			DOM._lock()._css({
				'position': 'absolute',
				'top': '0px',
				'left': '0px',
				'width': '100%',
				'height': height,
				'backgroundColor': this.config.background,
				'opacity': this.config.opacity,
				'zIndex': index
			});

			return this;
		},

		/**
		 * @access   Private
		 * @name     设置弹窗Button按钮集合。
		 * @param    {obj}     {Object}
		 * @example  this._createButton( [{name:'按钮文字', callback:function(){ console.log('按下执行的函数') }, focus:true, disabled:true }] )
		 * @return   {this}
		 */
		_createButton: function( arr ){
			var DOM = this.DOM,
			    _this = this,
			    i = 0,
			    arrLen = arr.length;

			for ( ; i<arrLen; i++ ){
				var _elem = this._sizzle( document.createElement('button') );

				_elem()._text( arr[i].name );
				if ( arr[i].focus ) _elem()._addClass('ui-dialog-autofocus');
				if ( arr[i].disabled ) _elem()._addClass('ui-dialog-disabled');

				if ( typeof arr[i].callback == 'function' ){
					var callback = function(obj){
						return function(){ 
							obj.call(_this);
						};
					}( arr[i].callback );
					_elem()._bind( 'click', callback );
				} else {
					if ( !arr[i].disabled ) _elem()._bind( 'click', function(){ _this._closeEvent( _this.config.close ); } );
				}

				DOM._bottom()[0].appendChild( _elem()[0] );
				DOM._footer()._show();
			}

		},

		/**
		 * @access   Private
		 * @name     设置弹窗相对窗口的位置
		 * @param    {top}      {String}     距离窗口的顶部位置
		 * @param    {left}     {String}     距离窗口的左边位置
		 * @param    {resize}   {Boolean}    如果是Resize事件则不设置z-index
		 * @example  this._position( '50%', '50%' );
		 * @return   {this}
		 */
		_position: function( top, left, resize ){
			var DOM = this.DOM,
			    winWidth = document.documentElement.clientWidth,
			    winHeight = document.documentElement.clientHeight,
			    bodyHeight = document.documentElement.scrollHeight,
			    scrollTop = win.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop,
			    changeTop = top.toString().indexOf('%'),
			    changeLeft = left.toString().indexOf('%'),
			    _left, _top, elemWidth, elemHeight;

			( this.IE6 ) ? DOM._wrap()._css( 'position', 'absolute' ) : DOM._wrap()._css( 'position', ( this.config.fixed ) ? 'fixed' : 'absolute' );

			elemWidth = parseInt( DOM._wrap()._getCurrentStyle( 'width' ) );
			elemHeight = parseInt( DOM._wrap()._getCurrentStyle( 'height' ) );

			var getPer = function( num, val, elem ){
				var px = ( val * ( num / 100 ) ) - ( elem / 2 );
				if ( px > ( val - elem ) ){
					return val - elem;
				}
				return px;
			};
			
			_left = ( changeLeft > -1 ) ? getPer( parseInt( left ), winWidth, elemWidth ) + 'px' : left ;
			_top = ( changeTop > -1 ) ? getPer( parseInt( top ), winHeight, elemHeight ) + 'px' : top ;
			
			if ( !this.config.fixed && bodyHeight > winHeight ){
				_top = parseInt( _top ) + scrollTop + 'px';
			}
			this.top = _top;

 			DOM._wrap()._css({ 'left': _left, 'top': _top });
 			if ( !resize ) DOM._wrap()._css( 'zIndex', win.MDialog.zIndex );

			return this;
		},

		/**
		 * @access    Private
		 * @name      将DOM遍历的元素保存到方法中，并且返回对象本身。
		 * @param     elem     {NodeList}     获取 Templates DOM 遍历
		 * @return    {this}
		 */
		_sizzle: function( elem ){
			var that = this;
			return function(){
				that[0] = elem;
				return that;
			};
		},

		/**
		 * @access   Private
		 * @name     关闭弹窗，并设置回调
		 * @param    name    {String}    获取默认样式名的属性  
		 * @example  DOM._body()._getCurrentStyle( 'width' );
		 * @return   {CSS VALUE}
		 */
		_closeEvent: function( callback ){
			var _this = this,
			    DOM = this.DOM;
			
			if ( !this.closeBoolean ){
				document.body.removeChild( DOM._wrap()[0] );
				if ( this.config.lock ) document.body.removeChild( DOM._lock()[0] );
				if ( typeof callback === 'function' ) callback.call( this );
			}

			this.closeBoolean = true;
			
			return this;
		},
		
		/**
		 * @access   Private
		 * @name     兼容IE6下滚动不能Fixed的问题
		 * @des      这样做会有抖动效果，用户体验不是很好，不过IE6吗，能给它做兼容就不错了！
		 * @return   {this}
		 */
		_fixedEvent: function(){
			var DOM = this.DOM,
			    scrollTop = window.pageYoffset || document.documentElement.scrollTop || document.body.scrollTop,
			    top = parseFloat( this.top );
			
			DOM._wrap()._css( 'top', ( scrollTop + top ) + 'px' );

			return this;
		},

		/**
		 * @access   Private
		 * @name     弹窗做焦点处理
		 * @desc     点击哪个弹窗显示在最上方，对有Lock层无效  
		 * @return   {this}
		 */
		_focusEvent: function(){
			var DOM = this.DOM;
			win.MDialog.zIndex = win.MDialog.zIndex + 2;
			DOM._wrap()._css( 'zIndex', win.MDialog.zIndex );
			return this;
		},

		/**
		 * @access   Private
		 * @name     页面resize时重新调整弹窗
		 * @example  this._resize();      
		 * @return   {this}
		 */
		_resize: function(){

			if ( this.config.lock ){
				var winHeight = document.documentElement.clientHeight,
				    bodyHeight = document.documentElement.scrollHeight,
				    height = ( winHeight > bodyHeight ) ? winHeight + 'px' : bodyHeight + 'px',
				    DOM = this.DOM;

				if ( DOM._lock() ) DOM._lock()._css( 'height', height );
			}

			this._position( this.config.top, this.config.left, true );
			return this;
		},

		/**
		 * @access   Private
		 * @name     页面拖拽功能
		 * @desc     绑定在 document 对象上是为了防止拖拽过快脱节的现象。
		 * @example  this._drag();      
		 * @return   {this}
		 */
		_drag: function(){
			var DOM = this.DOM,
			    fixed = this.config.fixed,
			    IE6 = this.IE6,
			    _domElem = this._sizzle( document ),
			    _wrapW = 0,
			    _wrapH = 0,
			    _x = 0,
			    _y = 0;

			//拖动过程
			var dargMove = function( event ){
				var event = event || window.event,
				    x = event.clientX - _x,
				    y = event.clientY - _y,
				    documentH = document.documentElement.scrollHeight,
				    screenH = document.documentElement.clientHeight,
				    winX = document.documentElement.clientWidth - _wrapW,
				    winY = ( fixed && !IE6 ) ? screenH : ( ( screenH > documentH ) ? screenH : documentH ),
				    winY = winY -  _wrapH,
				    left, top;

				left = ( x < 0 ) ? 0 : ( x >= 0 && x <= winX ) ? x : winX;
				top = ( y < 0 ) ? 0 : ( y >= 0 && y <= winY ) ? y : winY;

				DOM._wrap()._css({ 'left': left + 'px', 'top': top + 'px' });
			};

			//拖动结束
			var dargStop = function(){
				_domElem()._unbind( 'mousemove', dargMove );
			};

			//拖动开始
			var dargStart = function( event ){
				var event = event || window.event,
				    _top = parseFloat( DOM._wrap()._getCurrentStyle('top') ),
				    _left = parseFloat( DOM._wrap()._getCurrentStyle('left') );

				_x = event.clientX - _left;
				_y = event.clientY - _top;
				
				_wrapW = parseInt( DOM._wrap()._getCurrentStyle('width') );
			    _wrapH = parseInt( DOM._wrap()._getCurrentStyle('height') );
				
				_domElem()._bind( 'mousemove', dargMove );
				_domElem()._bind( 'mouseup', dargStop );
			};

			//绑定拖动
			DOM._header()._bind( 'mousedown', dargStart );

			return this;
		},

		/**
		 * @access   Private
		 * @name     获取默认样式
		 * @param    name    {String}    获取默认样式名的属性  
		 * @example  DOM._body()._getCurrentStyle( 'width' );
		 * @return   {CSS VALUE}
		 */
		_getCurrentStyle: function( name ){
			var css, width, height, elem = this[0];
			if ( 'defaultView' in document && 'getComputedStyle' in document.defaultView ) {
				css = document.defaultView.getComputedStyle( elem, false )[name];
			} else {
				if ( name == 'width' || name == 'height' ){
					var oRect = elem.getBoundingClientRect(),
						width = oRect.right - oRect.left,
						height = oRect.bottom - oRect.top;
					( name == 'width' ) ? css = width : css = height;
				} else {
					css = elem.currentStyle[name];
				}
			}
			return css;
		},

		/**
		 * @access   Private
		 * @name     给元素设置样式
		 * @param    name     {String}     样式名
		 * @param    value    {String}     样式属性
		 * @param    name     {Object}     样式采用对象字面量的方法来写。
		 * @example  DOM._css( 'width', '600px' );
		 * @example  DOM._css({ 'width':'600px', 'height':'600px' });
		 * @return   {this}
		 */
		_css: function( name, value ){
			var style = '', elem = this[0], obj = arguments[0];
			if ( typeof name === 'string' ){
				if ( typeof value !== undefined ){
					( name == 'opacity' ) ? this._opacity( value ) : elem.style[name] = value;
				}
			} else {
				for ( i in obj ){
					( i == 'opacity' ) ? this._opacity( obj[i] ) : elem.style[i] = obj[i];
				}
			}
			return this;
		},

		/**
		 * @access   Private
		 * @name     设置弹窗padding的值。
		 * @param    {Number || String}
		 * @example  DOM._content()._padding( 5 || '10px 10px' );
		 * @return   {this}
		 */
		_padding: function( value ){
			if ( typeof value === 'string' ){
				this._css( 'padding', value );
			} else {
				this._css( 'padding', value + 'px' );
			}
			return this;
		},

		/**
		 * @access    Public
		 * @name      设置容器宽，高，并重新调整弹窗位置
		 * @param     this._size( 'width', '200px' );
		 * @return    {this}
		 */
		_size: function( name, val ){
			var value, DOM = this.DOM;
			( typeof val == 'string' ) ? value = val : value = val + 'px';
			DOM._body()._css( name, value );
			this._position( this.config.top, this.config.left, true );
			return this;
		},
		
		/**
		 * @access   Private
		 * @name     设置元素的样式透明度，已做兼容性处理。
		 * @param    {value}     {Number}
		 * @example  DOM._opacity( 0.5 );
		 * @return   {this}
		 */
		_opacity: function( value ){
			var elem = this[0],
			    isOpacity = 'opacity' in document.documentElement.style;
			if ( typeof value !== undefined ){
				isOpacity ? elem.style.opacity = value : elem.style.filter = "Alpha(opacity=" + value * 100 + ")";
			}
			return this;
		},

		/**
		 * @access   Private
		 * @name     给元素添加class名
		 * @param    {name}     {String}
		 * @example  DOM._wrap()._addClass( 'className' );
		 * @return   {this}
		 */
		_addClass: function( name ){
			var elem = this[0],
			    className = elem.className.replace( /^\s+|\s+$/g, '' );
			elem.className = className + ' ' + name;
			return this;
		},

		/**
		 * @access   Private
		 * @name     给元素移出class名
		 * @param    {name}     {String}
		 * @example  DOM._wrap()._removeClass( 'className' );
		 * @return   {this}
		 */
		_removeClass: function( name ){
			var elem = this[0],
			    className = elem.className.replace( name, '' ).replace( /^\s+|\s+$/g, '' );
			elem.className = className;
			return this;
		},

		/**
		 * @access   Private
		 * @name     将元素设置为显示
		 * @param    {Null}
		 * @return   {this}
		 */
		_show: function(){
			this._css( 'display', 'block' );
			return this;
		},

		/**
		 * @access   Private
		 * @name     将元素设置为隐藏
		 * @param    {Null}
		 * @return   {this}
		 */
		_hide: function(){
			this._css( 'display', 'none' );
			return this;
		},

		/**
		 * @access   Private
		 * @name     将文本插入到元素中
		 * @param    {text}     {String}
		 * @return   {this}
		 */
		_text: function( text ){
			var elem = this[0];
			if ( document.all ){
				elem.innerText = text;
			} else {
				elem.textContent = text;
			}
			return this;
		},

		/**
		 * @access   Private
		 * @name     将HTML Elemnt元素插入到元素中
		 * @param    {html}     {HTML Elements}
		 * @return   {this}
		 */
		_html: function( html ){
			var elem = this[0];
			elem.innerHTML = html;
			return this;
		},

		/**
		 * @access   Private
		 * @name     检测传入的是否数组
		 * @param    {arr}     {Array}
		 * @return   {Boolean}
		 */
		_isArray: function( arr ){
			return Object.prototype.toString.call(arr) === '[object Array]';
		},

		/**
		 * @access   Private
		 * @name     给元素绑定事件
		 * @param    {evt}    	事件类型
		 * @param    {fn}		执行事件
		 * @return   {this}
		 */
		_bind: function( evt, fn ){
			var elem = this[0];
			if ( elem.addEventListener ){
				elem.addEventListener( evt, fn, false );
			} else {
				elem.attachEvent( 'on'+evt, fn );
			}
			return this;
		},

		/**
		 * @access   Private
		 * @name     给元素卸载事件
		 * @param    {evt}    	事件类型
		 * @param    {fn}		卸载事件
		 * @return   {this}
		 */
		_unbind: function( evt, fn ){
			var elem = this[0];
			if ( elem.removeEventListener ){
				elem.removeEventListener( evt, fn, false );
			} else {
				elem.detachEvent( 'on'+evt, fn );
			}
			return this;
		}
	};

	//将 .fn.init() 方法 原型传递给 MDialog
	MDialog.fn.init.prototype = MDialog.fn;

	//默认模板
	MDialog.templates =
	'<div class="MDialog-wrapper">' +
		'<table class="ui-dialog-table">' +
			'<tbody>' +
				'<tr>' +
					'<td>' +
						'<div class="ui-dialog-header">' +
							'<a class="ui-dialog-close" href="javascript:;">x</a>' +
							'<div class="ui-dialog-title"></div>' +
						'</div>' +
					'</td>' +
				'</tr>' +
				'<tr>' +
					'<td>' +
						'<div class="ui-dialog-body">' +
							'<div class="ui-dialog-content"></div>' +
						'</div>' +
					'</td>' +
				'</tr>' +
				'<tr>' +
					'<td>' +
						'<div class="ui-dialog-footer">' +
							'<div class="ui-dialog-statusbar"></div>' +
							'<div class="ui-dialog-bottom"></div>' +
							'<div style="clear:both;height:0;overflow:hidden;"></div>' +
						'</div>' +
					'</td>' +
				'</tr>' +
			'</tbody>' +
		'</table>' +
	'</div>';

	//默认参数
	MDialog.defaults = {
		title: '\u6d88\u606f',      //默认标题消息
		content: 'Loading....',     //默认内容
		statusbar: null,            //默认对话框左下脚内容
		init: null,                 //默认载入弹窗之后回调函数
		close: null,                //点击关闭按钮之后回调函数
		width: 'auto',              //默认宽度
		height: 'auto',             //默认高度
		padding: '20px 15px',       //设置默认填充
		lock: false,                //是否支持锁屏
		background: '#000',         //锁屏默认背景色
		opacity: 0.7,               //锁屏默认透明
		fixed: false,               //是否开启定位
		esc: true,                  //是否支持ESC
		time: null,                 //自动关闭时间
		left: '50%',                //默认弹窗距离左边位置
		top: '38.2%',               //默认弹窗距离上边位置
		zIndex: 1992,               //默认弹窗z-index 层级
		id: null,                   //防止重复弹出
		ok: null,                   //默认点击确定之后回调函数
		cancel: null,               //默认点击取消之后回调函数
		okVal: '\u786e\u5b9a',      //确定按钮文字
		cancelVal: '\u53d6\u6d88',  //取消按钮文字
		button: null,               //默认自定义按钮
		resize: true,               //是否绑定resize
		drag: true                  //是否支持拖拽
	};

	//支持AMD加载
	if ( typeof define = 'function' && define.amd ){
		define( 'MDialog', [], function(){
			return MDialog;
		});
	}
	
	//返回对象给全局
	win.MDialog = $M = MDialog;

}( window ));