$(function(){
  // ファーストビュー
  let headerH = $('header').height();
  $(function () {
    $('.fv').outerHeight($(window).height() - headerH);
  });
  $(window).on('resize', function () {
    winH = $(window).height();
    $('.fv').outerHeight(winH - headerH);
  });

  /*
   * モーション
   */

  // 一文字ずつspan化
  $.fn.letterSpan = function() {
    // idではなくclassを使い複数設定する想定で each を使う
    $(this).each(function() {
        var text = $.trim(this.textContent),
            html = "";

        text.split("").forEach(function(v) {
            html += "<span>" + v + "</span>";
        });

        this.innerHTML = html;
    });
  };

  // アニメーション
  function fadeAnime(){
    let adjOffset = is_sp ? 0 : 90;
    $('.js-letter-fadeIn').each(function(){
      var elemPos = $(this).offset().top + adjOffset;
      var scroll = $(window).scrollTop();
      var windowHeight = $(window).height();
      if (scroll >= elemPos - windowHeight){
        var el = $(this).find('span');
        for (let i = 0; i < el.length; i++) {
          var delay = Math.random() * 1200;
          setTimeout(function() {
            el[i].classList.add('js-visible');
          }, delay);
        };
      }
    });
  }

  // パラパラコンポーネント
  function parapara(target){
    var el = target.find('span');
    for (let i = 0; i < el.length; i++) {
      var delay = Math.random() * 1000;
      setTimeout(function() {
        el[i].classList.add('js-visible');
      }, delay);
    }
  }

  // 1行ずつ表示パラパラエフェクト
  function firstViewAnime(){
    let target1 = $(".js-letter-fv01");
    parapara(target1);
    setTimeout(function() {
      let target2 = $(".js-letter-fv02");
      parapara(target2);
    }, 3000);
    setTimeout(function() {
      let target3 = $(".js-letter-fv03");
      parapara(target3);
    }, 7000);
  }

  // 発火
  $('.js-letter-fadeIn, .js-letter-fv01, .js-letter-fv02, .js-letter-fv03').letterSpan(); // .js-letter-fadeIn クラスのコンテナ全てに反映
  firstViewAnime();

  $(window).on('scroll', function() {
    fadeAnime(); // パラパラエフェクト
  });

});