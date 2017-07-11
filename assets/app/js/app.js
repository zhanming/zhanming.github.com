// change href target property
jQuery(document).ready(function() {
	// add target="_blank"
	jQuery('a[href^="http"]').each(function() {
		jQuery(this).attr('target', '_blank');
	});
});
