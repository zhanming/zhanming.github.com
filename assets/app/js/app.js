// change href target property
jQuery(document).ready(function() {
	// add target="_blank"
	jQuery('a[href^="http"]').each(function() {
		jQuery(this).attr('target', '_blank');
	});
});

function highlightRightNav(heading)
{
  if (document.location.pathname.indexOf("/glossary/") < 0){
    $("#my_toc a.active").removeClass("active");

    if (heading !== "title") {
      $("#my_toc a[href='#" + heading + "']").addClass('active');
    }
  }
}

var currentHeading = "";
jQuery(window).scroll(function(){
  var headingPositions = new Array();
  jQuery("h1, h2, h3, h4, h5, h6").each(function(){
    if (this.id == "") this.id="title";
    headingPositions[this.id]=this.getBoundingClientRect().top;
  });
  headingPositions.sort();
  // the headings have all been grabbed and sorted in order of their scroll
  // position (from the top of the page). First one is toppermost.
  for(var key in headingPositions)
  {
    if (headingPositions[key] > 0 && headingPositions[key] < 200)
    {
      if (currentHeading != key)
      {
        // a new heading has scrolled to within 200px of the top of the page.
        // highlight the right-nav entry and de-highlight the others.
        highlightRightNav(key);
        currentHeading = key;
      }
      break;
    }
  }
});