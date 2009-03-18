
var ccm_totalAdvancedSearchFields = 0;
var ccm_alLaunchType;
var ccm_alActiveAssetField = "";
var ccm_alProcessorTarget = "";
var ccm_alDebug = false;

ccm_triggerSelectFile = function(fID, af) {
	if (af == null) {
		var af = ccm_alActiveAssetField;
	}
	//alert(af);
	var obj = $('#' + af + "-fm-selected");
	var dobj = $('#' + af + "-fm-display");
	dobj.hide();
	obj.show();
	obj.load(CCM_TOOLS_PATH + '/files/selector_data?fID=' + fID + '&ccm_file_selected_field=' + af, function() {
		/*
		$(this).find('a.ccm-file-manager-clear-asset').click(function(e) {
			var field = $(this).attr('ccm-file-manager-field');
			ccm_clearFile(e, field);
		});
		*/
		obj.attr('fID', fID);
		obj.attr('ccm-file-manager-can-view', obj.children('div').attr('ccm-file-manager-can-view'));
		obj.attr('ccm-file-manager-can-edit', obj.children('div').attr('ccm-file-manager-can-edit'));
		
		obj.click(function(e) {
			e.stopPropagation();
			ccm_alActivateMenu($(this),e);
		});
	});
	var vobj = $('#' + af + "-fm-value");
	vobj.attr('value', fID);
}
 
ccm_clearFile = function(e, af) {
	e.stopPropagation();
	var obj = $('#' + af + "-fm-selected");
	var dobj = $('#' + af + "-fm-display");
	var vobj = $('#' + af + "-fm-value");
	vobj.attr('value', 0);
	obj.hide();
	dobj.show();
}

ccm_activateFileManager = function(altype) {
	//delegate event handling to table container so clicks
	//to our star don't interfer with clicks to our rows
	ccm_alSetupSelectFiles();
	
	$(document).click(function(e) {		
		e.stopPropagation();
		ccm_alSelectNone();
	});
	
	if (altype == 'DASHBOARD') {
		$(".dialog-launch").dialog();
	}
	ccm_alLaunchType = altype;
	
	$("#ccm-file-search-add-option").click(function() {
		ccm_totalAdvancedSearchFields++;
		$("#ccm-file-search-fields-wrapper").append('<div class="ccm-file-search-field" id="ccm-file-search-field-set' + ccm_totalAdvancedSearchFields + '">' + $("#ccm-file-search-field-base").html() + '<\/div>');
		ccm_activateFileManagerFields(ccm_totalAdvancedSearchFields);
	});
	
	$(".ccm-dashboard-file-search").ajaxForm({
		beforeSubmit: function() {
			ccm_deactivateSearchResults();
		},
			/*beforeSubmit: function() {
				ccm_alShowLoader();
				$("#ccm-al-search-results").html('');
				return true;
			},*/
			
			success: function(resp) {
				ccm_alParseSearchResponse(resp);
			}
	});
	ccm_alSetupInPagePaginationAndSorting();
	ccm_alSetupCheckboxes();
	ccm_alSetupFileProcessor();
	ccm_alSetupSingleUploadForm();
	// setup upload form
}

ccm_alSetupSingleUploadForm = function() {
	$(".ccm-file-manager-submit-single").submit(function() {
		$(this).attr('target', ccm_alProcessorTarget);
		ccm_alSubmitSingle($(this).get(0));		
	});
}

ccm_activateFileSelectors = function() {
	$(".ccm-file-manager-launch").click(function() {
		ccm_alLaunchSelectorFileManager($(this).parent().attr('ccm-file-manager-field'));	
	});
}

ccm_alLaunchSelectorFileManager = function(selector) {
	ccm_alActiveAssetField = selector;
	var filterStr = "";
	
	var types = $('#' + selector + '-fm-display input.ccm-file-manager-filter');
	if (types.length) {
		for (i = 0; i < types.length; i++) {
			filterStr += '&' + $(types[i]).attr('name') + '=' + $(types[i]).attr('value');		
		}
	}
	
	ccm_launchFileManager(filterStr);
}

ccm_launchFileManager = function(filters) {
	$.fn.dialog.open({
		width: '90%',
		height: '70%',
		modal: false,
		href: CCM_TOOLS_PATH + "/files/search_dialog?search=1" + filters,
		title: ccmi18n_filemanager.title
	});
}

ccm_launchFileSetPicker = function(fsID) {
	$.fn.dialog.open({
		width: 500,
		height: 160,
		modal: false,
		href: CCM_TOOLS_PATH + '/files/pick_set?oldFSID=' + fsID,
		title: ccmi18n_filemanager.sets				
	});
}

ccm_alSubmitPickSetForm = function() {
	jQuery.fn.dialog.closeTop();
	var fsSel = $(".ccm-file-set-pick-cb #fsID")[0];
	var json = { "fsID" : fsSel.value,
	             "fsName" : fsSel.options[fsSel.options.selectedIndex].text };
	ccm_chooseAsset(json);
}

ccm_alSubmitSetsForm = function() {
	ccm_deactivateSearchResults();
	$("#ccm-file-add-to-set-form").ajaxSubmit(function(resp) {
		jQuery.fn.dialog.closeTop();
		$(".ccm-dashboard-file-search").ajaxSubmit(function(resp) {
			ccm_alParseSearchResponse(resp);
		});
	});
}

ccm_alSubmitPasswordForm = function() {
	ccm_deactivateSearchResults();
	$("#ccm-file-password-form").ajaxSubmit(function(resp) {
		jQuery.fn.dialog.closeTop();
		$(".ccm-dashboard-file-search").ajaxSubmit(function(resp) {
			ccm_alParseSearchResponse(resp);
		});
	});
}

		
ccm_alSetupSetsForm = function() {
	// Setup the tri-state checkboxes
	$("div.ccm-file-set-add-cb a").each(function() {
		var cb = $(this);
		var startingState = cb.attr("ccm-tri-state-startup");
		$(this).click(function() {
			var selectedState = $(this).attr("ccm-tri-state-selected");
			var toSetState = 0;
			switch(selectedState) {
				case '0':
					if (startingState == '1') {
						toSetState = '1';
					} else {
						toSetState = '2';
					}
					break;
				case '1':
					toSetState = '2';
					break;
				case '2':
					toSetState = '0';
					break;
			}
			
			$(this).attr('ccm-tri-state-selected', toSetState);
			$(this).find('input').val(toSetState);
			$(this).find('img').attr('src', CCM_IMAGE_PATH + '/checkbox_state_' + toSetState + '.png');
		});
	});
	$("#ccm-file-add-to-set-form").submit(function() {
		ccm_alSubmitSetsForm();
		return false;
	});
}

ccm_alSetupPasswordForm = function() {
	$("#ccm-file-password-form").submit(function() {
		ccm_alSubmitPasswordForm();
		return false;
	});
}	
ccm_alRescanFiles = function() {
	var turl = CCM_TOOLS_PATH + '/files/rescan?';
	var files = arguments;
	for (i = 0; i < files.length; i++) {
		turl += 'fID[]=' + files[i] + '&';
	}
	$.fn.dialog.open({
		title: ccmi18n_filemanager.rescan,
		href: turl,
		width: 350,
		modal: false,
		height: 200,
		onClose: function() {
			if (files.length == 1) {
				$('#ccm-file-properties-wrapper').html('');
				jQuery.fn.dialog.showLoader();
				
				// open the properties window for this bad boy.
				$("#ccm-file-properties-wrapper").load(CCM_TOOLS_PATH + '/files/properties?fID=' + files[0] + '&reload=1', false, function() {
					jQuery.fn.dialog.hideLoader();
					$(this).find(".dialog-launch").dialog();

				});				
			}
		}
	});
}

	
ccm_alSelectPermissionsEntity = function(selector, id, name) {
	var html = $('#ccm-file-permissions-entity-base').html();
	$('#ccm-file-permissions-entities-wrapper').append('<div class="ccm-file-permissions-entity">' + html + '<\/div>');
	var p = $('.ccm-file-permissions-entity');
	var ap = p[p.length - 1];
	$(ap).find('h2 span').html(name);
	$(ap).find('input[type=hidden]').val(selector + '_' + id);
	$(ap).find('input[type=radio]').each(function() {
		$(this).attr('name', $(this).attr('name') + '_' + selector + '_' + id);
	});
	$(ap).find('div.ccm-file-access-extensions input[type=checkbox]').each(function() {
		$(this).attr('name', $(this).attr('name') + '_' + selector + '_' + id + '[]');
	});
	
	ccm_alActivateFilePermissionsSelector();	
}

ccm_alActivateFilePermissionsSelector = function() {
	$("tr.ccm-file-access-add input").unbind();
	$("tr.ccm-file-access-add input").click(function() {
		var p = $(this).parents('div.ccm-file-permissions-entity')[0];
		if ($(this).val() == ccmi18n_filemanager.PTYPE_CUSTOM) {
			$(p).find('div.ccm-file-access-add-extensions').show();				
		} else {
			$(p).find('div.ccm-file-access-add-extensions').hide();				
		}
	});
	$("tr.ccm-file-access-file-manager input").click(function() {
		var p = $(this).parents('div.ccm-file-permissions-entity')[0];
		if ($(this).val() == ccmi18n_filemanager.PTYPE_ALL) {
			$(p).find('tr.ccm-file-access-view').show();				
			$(p).find('tr.ccm-file-access-add').show();				
			$(p).find('tr.ccm-file-access-edit').show();				
			$(p).find('tr.ccm-file-access-admin').show();
			//$(p).find('div.ccm-file-access-add-extensions').show();				
		} else {
			$(p).find('tr.ccm-file-access-view').hide();				
			$(p).find('tr.ccm-file-access-add').hide();				
			$(p).find('tr.ccm-file-access-edit').hide();				
			$(p).find('tr.ccm-file-access-admin').hide();				
			$(p).find('div.ccm-file-access-add-extensions').hide();				
		}
	});


	$("a.ccm-file-permissions-remove").click(function() {
		$(this).parent().parent().fadeOut(100, function() {
			$(this).remove();
		});
	});
	$("input[name=toggleCanAddExtension]").unbind();
	$("input[name=toggleCanAddExtension]").click(function() {
		var ext = $(this).parent().parent().find('div.ccm-file-access-extensions');
		
		if ($(this).attr('checked') == 1) {
			ext.find('input').attr('checked', true);
		} else {
			ext.find('input').attr('checked', false);
		}
	});
}


ccm_alParseSearchResponse = function(resp) {
	$("#ccm-file-search-results").html(resp);
	ccm_activateSearchResults();
	ccm_alSetupSelectFiles();
}

ccm_alSetupVersionSelector = function() {
	$("#ccm-file-versions-grid input[type=radio]").click(function() {
		$('#ccm-file-versions-grid tr').removeClass('ccm-file-versions-grid-active');
		
		var trow = $(this).parent().parent();
		var fID = trow.attr('fID');
		var fvID = trow.attr('fvID');
		var postStr = 'task=approve_version&fID=' + fID + '&fvID=' + fvID;
		$.post(CCM_TOOLS_PATH + '/files/properties', postStr, function(resp) {
			trow.addClass('ccm-file-versions-grid-active');
			trow.find('td').show('highlight', {
				color: '#FFF9BB'
			});
		});
	});
}

ccm_alDeleteFiles = function() {
	$("#ccm-delete-files-form").ajaxSubmit(function(resp) {
		ccm_parseJSON(resp, function() {	
			jQuery.fn.dialog.closeTop();
			ccm_deactivateSearchResults();
			$(".ccm-dashboard-file-search").ajaxSubmit(function(resp) {
				ccm_alParseSearchResponse(resp);
			});
		});
	});
}

ccm_alSetupSelectFiles = function() {
	$('#ccm-file-list').click(function(e){
		e.stopPropagation();
		if ($(e.target).is('img.ccm-star')) {	
			var fID = $(e.target).parents('tr.ccm-file-list-record')[0].id;
			fID = fID.substring(3);
			ccm_starFile(e.target,fID);
		}
		else{
			$(e.target).parents('tr.ccm-file-list-record').each(function(){
				ccm_alActivateMenu($(this), e);		
			});
		}
	});
	$("div.ccm-file-list-thumbnail-image img").hover(function(e) {
		var fID = $(this).parent().attr('fID');
		var obj = $('#fID' + fID + 'hoverThumbnail');
		if (obj.length > 0) {
			var tdiv = obj.find('div');
			var pos = obj.position();
			tdiv.css('top', pos.top);
			tdiv.css('left', pos.left);
			tdiv.show();

		}
	}, function() {
		var fID = $(this).parent().attr('fID');
		var obj = $('#fID' + fID + 'hoverThumbnail');
		var tdiv = obj.find('div');
		tdiv.hide();
			
	});
}
ccm_deactivateSearchResults = function() {
	$("#ccm-file-list-wrapper").css('opacity','0.5');	
	$("#ccm-search-files").attr('disabled', true);
	$("#ccm-file-search-loading").show();
}

ccm_activateSearchResults = function() {
	$("#ccm-file-list-wrapper").css('opacity','1');	
	$("#ccm-file-search-loading").hide();
	$("#ccm-search-files").attr('disabled', false);
	ccm_alSetupInPagePaginationAndSorting();
	ccm_alSetupCheckboxes();
}

ccm_alSetupCheckboxes = function() {
	$("#ccm-file-list-cb-all").click(function() {
		if ($(this).attr('checked') == true) {
			$('.ccm-file-list-record td.ccm-file-list-cb input[type=checkbox]').attr('checked', true);
			$("#ccm-file-list-multiple-operations").attr('disabled', false);
		} else {
			$('.ccm-file-list-record td.ccm-file-list-cb input[type=checkbox]').attr('checked', false);
			$("#ccm-file-list-multiple-operations").attr('disabled', true);
		}
	});
	$(".ccm-file-list-record td.ccm-file-list-cb input[type=checkbox]").click(function(e) {
		e.stopPropagation();
		ccm_alRescanMultiFileMenu();
	});
	$(".ccm-file-list-record td.ccm-file-list-cb").click(function(e) {
		e.stopPropagation();
		$(this).find('input[type=checkbox]').click();
		ccm_alRescanMultiFileMenu();
	});
	
	$("#ccm-file-list-multiple-operations").change(function() {
		var action = $(this).val();
		var fIDstring = ccm_alGetSelectedFileIDs();
		switch(action) {
			case "delete":
				jQuery.fn.dialog.open({
					width: 500,
					height: 400,
					modal: false,
					href: CCM_TOOLS_PATH + '/files/delete?' + fIDstring,
					title: ccmi18n_filemanager.deleteFile				
				});
				break;
			case "sets":
				jQuery.fn.dialog.open({
					width: 500,
					height: 400,
					modal: false,
					href: CCM_TOOLS_PATH + '/files/add_to?' + fIDstring,
					title: ccmi18n_filemanager.sets				
				});
				break;
			case "rescan":
				jQuery.fn.dialog.open({
					width: 350,
					height: 200,
					modal: false,
					href: CCM_TOOLS_PATH + '/files/rescan?' + fIDstring,
					title: ccmi18n_filemanager.rescan				
				});
				break;
			case "download":
				window.frames[ccm_alProcessorTarget].location = CCM_TOOLS_PATH + '/files/download?' + fIDstring;
				break;
		}
		
		$(this).get(0).selectedIndex = 0;
	});
}

ccm_alGetSelectedFileIDs = function() {
	var fidstr = '';
	$(".ccm-file-list-record td.ccm-file-list-cb input[type=checkbox]:checked").each(function() {
		fidstr += 'fID[]=' + $(this).val() + '&';
	});
	return fidstr;
}

ccm_alRescanMultiFileMenu = function() {
	if ($(".ccm-file-list-record td.ccm-file-list-cb input[type=checkbox]:checked").length > 0) {
		$("#ccm-file-list-multiple-operations").attr('disabled', false);
	} else {
		$("#ccm-file-list-multiple-operations").attr('disabled', true);
	}
}
ccm_alSetupInPagePaginationAndSorting = function() {
	$("#ccm-file-list th a").click(function() {
		ccm_deactivateSearchResults();
		$("#ccm-file-search-results").load($(this).attr('href'), false, function() {
			ccm_activateSearchResults();
			ccm_alSetupSelectFiles();
		});
		return false;
	});
	$("div.ccm-pagination a").click(function() {
		ccm_deactivateSearchResults();
		$("#ccm-file-search-results").load($(this).attr('href'), false, function() {
			ccm_activateSearchResults();
			ccm_alSetupSelectFiles();
		});
		return false;
	});
}

ccm_activateFileManagerFields = function(fieldset) {
	$("#ccm-file-search-field-set" + fieldset + " select[name=fvField]").unbind();
	$("#ccm-file-search-field-set" + fieldset + " select[name=fvField]").change(function() {
		var selected = $(this).find(':selected').val();
		$(this).next('input.ccm-file-selected-field').val(selected);
		$(this).parents('table').find('.ccm-file-search-option').hide();
		var itemToCopy = $('#ccm-file-search-field-base-elements .ccm-file-search-option[search-field=' + selected + ']');
		$("#ccm-file-search-field-set" + fieldset + " .ccm-file-selected-field-content").html('');
		itemToCopy.clone().appendTo("#ccm-file-search-field-set" + fieldset + " .ccm-file-selected-field-content");

		$("#ccm-file-search-field-set" + fieldset + " .ccm-file-search-option[search-field=date_added] input").each(function() {
			if ($(this).attr('id') == 'date_from') {
				$(this).attr('id', 'date_from' + fieldset);
			} else if ($(this).attr('id') == 'date_to') {
				$(this).attr('id', 'date_to' + fieldset);
			}
		});
	
		$("#ccm-file-search-field-set" + fieldset + " .ccm-file-search-option-type-date input").each(function() {
			$(this).attr('id', $(this).attr('id') + fieldset);
		});
		
		$("#ccm-file-search-field-set" + fieldset + " .ccm-file-search-option[search-field=date_added] input").datepicker({
			showAnim: 'fadeIn'
		});
		$("#ccm-file-search-field-set" + fieldset + " .ccm-file-search-option-type-date input").datepicker({
			showAnim: 'fadeIn'
		});
		
	});
	
	// add the initial state of the latest select menu
	var lastSelect = $("#ccm-file-search-field-set" + fieldset + " select[name=fvField]").eq($(".ccm-file-search-field select[name=fvField]").length-1);
	var selected = lastSelect.find(':selected').val();
	lastSelect.next('input.ccm-file-selected-field').val(selected);

	
	$("#ccm-file-search-field-set" + fieldset + " .ccm-file-search-remove-option").unbind();
	$("#ccm-file-search-field-set" + fieldset + " .ccm-file-search-remove-option").click(function() {
		$(this).parents('table').parent().remove();
		//ccm_totalAdvancedSearchFields--;
	});
}

ccm_alActiveEditableProperties = function() {
	$("tr.ccm-file-manager-editable-field").each(function() {
		var trow = $(this);
		$(this).find('a').click(function() {
			trow.find('.ccm-file-manager-editable-field-text').hide();
			trow.find('.ccm-file-manager-editable-field-form').show();
			trow.find('.ccm-file-manager-editable-field-save-button').show();
		});
		
		trow.find('form').submit(function() {
			ccm_alSubmitEditableProperty(trow);
			return false;
		});
		
		trow.find('.ccm-file-manager-editable-field-save a').click(function() {
			ccm_alSubmitEditableProperty(trow);
		});
	});
}

ccm_alSubmitEditableProperty = function(trow) {
	trow.find('.ccm-file-manager-editable-field-save-button').hide();
	trow.find('.ccm-file-manager-editable-field-loading').show();
	trow.find('form').ajaxSubmit(function(resp) {
		// resp is new HTML to display in the div
		trow.find('.ccm-file-manager-editable-field-loading').hide();
		trow.find('.ccm-file-manager-editable-field-save-button').show();
		trow.find('.ccm-file-manager-editable-field-text').html(resp);
		trow.find('.ccm-file-manager-editable-field-form').hide();
		trow.find('.ccm-file-manager-editable-field-save-button').hide();
		trow.find('.ccm-file-manager-editable-field-text').show();
		trow.find('td').show('highlight', {
			color: '#FFF9BB'
		});

	});
}

ccm_alSetupFileProcessor = function() {
	var ts = parseInt(new Date().getTime().toString().substring(0, 10))
	var ifr = document.createElement('iframe');
	ifr.id = 'ccm-al-upload-processor' + ts;
	ifr.name = 'ccm-al-upload-processor' + ts;
	ifr.style.border='0px';
	ifr.style.width='0px';
	ifr.style.height='0px';
	ifr.style.display = "none";
	document.body.appendChild(ifr);
	
	if (ccm_alDebug) {
		ccm_alProcessorTarget = "_blank";
	} else {
		ccm_alProcessorTarget = 'ccm-al-upload-processor' + ts;
	}
}

ccm_alSubmitSingle = function(form) {
	if ($(form).find(".ccm-al-upload-single-file").val() == '') { 
		alert(ccmi18n_filemanager.uploadErrorChooseFile);
		return false;
	} else {
		$(form).find('.ccm-al-upload-single-submit').hide();
		$(form).find('.ccm-al-upload-single-loader').show();
	}
}

ccm_alResetSingle = function () {
	$('.ccm-al-upload-single-file').val('');
	$('.ccm-al-upload-single-loader').hide();
	$('.ccm-al-upload-single-submit').show();
}

ccm_alRefresh = function(highlightFIDs) {
	ccm_deactivateSearchResults();
	$("#ccm-file-search-results").load(CCM_TOOLS_PATH + '/files/search_results', {
		'ccm_order_by': 'fvDateAdded',
		'ccm_order_dir': 'desc'
	}, function() {
		ccm_activateSearchResults();
		ccm_alResetSingle();
		ccm_alHighlightFileIDArray(highlightFIDs);
		ccm_alSetupSelectFiles();

	});
}

ccm_alHighlightFileIDArray = function(ids) {
	for (i = 0; i < ids.length; i++) {
		var oldBG = $("#fID" + ids[i] + ' td').css('backgroundColor');
		$("#fID" + ids[i] + ' td').animate({ backgroundColor: '#FFF9BB'}, { queue: true, duration: 300 }).animate( {backgroundColor: oldBG}, 500);
	}
}

ccm_alSelectFile = function(fID) {
	if (typeof(ccm_chooseAsset) == 'function') {

		ccm_deactivateSearchResults();

		$.getJSON(CCM_TOOLS_PATH + '/files/get_data.php', {'fID' : fID}, function(resp) {
			ccm_parseJSON(resp, function() {
				ccm_chooseAsset(resp);
				jQuery.fn.dialog.closeTop();
			});
		});
		
	} else {
		ccm_triggerSelectFile(fID);
		jQuery.fn.dialog.closeTop();	
	}

}

ccm_alActivateMenu = function(obj, e) {
	
	// Is this a file that's already been chosen that we're selecting?
	// If so, we need to offer the reset switch
	
	var selectedFile = $(obj).find('div[ccm-file-manager-field]');
	var selector = '';
	if(selectedFile.length > 0) {
		selector = selectedFile.attr('ccm-file-manager-field');
	}
	ccm_hideMenus();
	
	var fID = $(obj).attr('fID');

	// now, check to see if this menu has been made
	var bobj = document.getElementById("ccm-al-menu" + fID + selector);

	if (ccm_alLaunchType != 'DASHBOARD' && selector == '') {
		// then we are in file list mode in the site, which means we 
		// we don't give out all the options in the list
		ccm_alSelectFile(fID);
		return;
	}
	
	if (!bobj) {
		// create the 1st instance of the menu
		el = document.createElement("DIV");
		el.id = "ccm-al-menu" + fID + selector;
		el.className = "ccm-menu";
		el.style.display = "none";
		document.body.appendChild(el);
		
		var filepath = $(obj).attr('al-filepath'); 
		bobj = $("#ccm-al-menu" + fID + selector);
		bobj.css("position", "absolute");
		
		//contents  of menu
		var html = '<div class="ccm-menu-tl"><div class="ccm-menu-tr"><div class="ccm-menu-t"></div></div></div>';
		html += '<div class="ccm-menu-l"><div class="ccm-menu-r">';
		html += '<ul>';
		if (ccm_alLaunchType != 'DASHBOARD') {
			// if we're launching this at the selector level, that means we've already chosen a file, and this should instead launch the library
			var onclick = (selectedFile.length > 0) ? 'ccm_alLaunchSelectorFileManager(\'' + selector + '\')' : 'ccm_alSelectFile(' + fID + ')';
			var chooseText = (selectedFile.length > 0) ? ccmi18n_filemanager.chooseNew : ccmi18n_filemanager.select;
			html += '<li><a class="ccm-icon" dialog-modal="false" dialog-width="90%" dialog-height="70%" dialog-title="' + ccmi18n_filemanager.select + '" id="menuSelectFile' + fID + '" href="javascript:void(0)" onclick="' + onclick + '"><span style="background-image: url(' + CCM_IMAGE_PATH + '/icons/add.png)">'+ chooseText + '<\/span><\/a><\/li>';
		}
		if (selectedFile.length > 0) {
			html += '<li><a class="ccm-icon" href="javascript:void(0)" id="menuClearFile' + fID + selector + '"><span style="background-image: url(' + CCM_IMAGE_PATH + '/icons/remove.png)">'+ ccmi18n_filemanager.clear + '<\/span><\/a><\/li>';
		}
		
		if (ccm_alLaunchType != 'DASHBOARD' && selectedFile.length > 0) {
			html += '<li class="header"></li>';	
		}
		if ($(obj).attr('ccm-file-manager-can-view') == '1') {
			html += '<li><a class="ccm-icon dialog-launch" dialog-modal="false" dialog-width="90%" dialog-height="75%" dialog-title="' + ccmi18n_filemanager.view + '" id="menuView' + fID + '" href="' + CCM_TOOLS_PATH + '/files/view?fID=' + fID + '"><span style="background-image: url(' + CCM_IMAGE_PATH + '/icons/design_small.png)">'+ ccmi18n_filemanager.view + '<\/span><\/a><\/li>';
		} else {
			html += '<li><a class="ccm-icon" id="menuDownload' + fID + '" target="' + ccm_alProcessorTarget + '" href="' + CCM_TOOLS_PATH + '/files/download?fID=' + fID + '"><span style="background-image: url(' + CCM_IMAGE_PATH + '/icons/design.png)">'+ ccmi18n_filemanager.download + '<\/span><\/a><\/li>';	
		}
		if ($(obj).attr('ccm-file-manager-can-edit') == '1') {
			html += '<li><a class="ccm-icon dialog-launch" dialog-modal="false" dialog-width="90%" dialog-height="75%" dialog-title="' + ccmi18n_filemanager.edit + '" id="menuEdit' + fID + '" href="' + CCM_TOOLS_PATH + '/files/edit?fID=' + fID + '"><span style="background-image: url(' + CCM_IMAGE_PATH + '/icons/edit_small.png)">'+ ccmi18n_filemanager.edit + '<\/span><\/a><\/li>';
		}
		html += '<li><a class="ccm-icon dialog-launch" dialog-modal="false" dialog-width="630" dialog-height="450" dialog-title="' + ccmi18n_filemanager.properties + '" id="menuProperties' + fID + '" href="' + CCM_TOOLS_PATH + '/files/properties?fID=' + fID + '"><span style="background-image: url(' + CCM_IMAGE_PATH + '/icons/wrench.png)">'+ ccmi18n_filemanager.properties + '<\/span><\/a><\/li>';
		if ($(obj).attr('ccm-file-manager-can-can-replace') == '1') {
			html += '<li><a class="ccm-icon dialog-launch" dialog-modal="false" dialog-width="300" dialog-height="250" dialog-title="' + ccmi18n_filemanager.replace + '" id="menuFileReplace' + fID + '" href="' + CCM_TOOLS_PATH + '/files/replace?fID=' + fID + '"><span style="background-image: url(' + CCM_IMAGE_PATH + '/icons/paste_small.png)">'+ ccmi18n_filemanager.replace + '<\/span><\/a><\/li>';
		}
		html += '<li><a class="ccm-icon dialog-launch" dialog-modal="false" dialog-width="500" dialog-height="400" dialog-title="' + ccmi18n_filemanager.sets + '" id="menuFileSets' + fID + '" href="' + CCM_TOOLS_PATH + '/files/add_to?fID=' + fID + '"><span style="background-image: url(' + CCM_IMAGE_PATH + '/icons/window_new.png)">'+ ccmi18n_filemanager.sets + '<\/span><\/a><\/li>';
		if ($(obj).attr('ccm-file-manager-can-admin') == '1') {
			html += '<li class="header"></li>';
			html += '<li><a class="ccm-icon dialog-launch" dialog-modal="false" dialog-width="400" dialog-height="380" dialog-title="' + ccmi18n_filemanager.permissions + '" id="menuFilePermissions' + fID + '" href="' + CCM_TOOLS_PATH + '/files/permissions?fID=' + fID + '"><span style="background-image: url(' + CCM_IMAGE_PATH + '/icons/permissions_small.png)">'+ ccmi18n_filemanager.permissions + '<\/span><\/a><\/li>';
			html += '<li><a class="ccm-icon dialog-launch" dialog-modal="false" dialog-width="500" dialog-height="400" dialog-title="' + ccmi18n_filemanager.deleteFile + '" id="menuDeleteFile' + fID + '" href="' + CCM_TOOLS_PATH + '/files/delete?fID=' + fID + '"><span style="background-image: url(' + CCM_IMAGE_PATH + '/icons/delete_small.png)">'+ ccmi18n_filemanager.deleteFile + '<\/span><\/a><\/li>';
		}
		html += '</ul>';
		html += '</div></div>';
		html += '<div class="ccm-menu-bl"><div class="ccm-menu-br"><div class="ccm-menu-b"></div></div></div>';
		bobj.append(html);
		
		$("#ccm-al-menu" + fID + selector + " a.dialog-launch").dialog();
		
		$('a#menuClearFile' + fID + selector).click(function(e) {
			ccm_clearFile(e, selector);
			ccm_hideMenus();
		});

	} else {
		bobj = $("#ccm-al-menu" + fID + selector);
	}
	
	ccm_fadeInMenu(bobj, e);

}

ccm_alSelectNone = function() {
	ccm_hideMenus();
}

var checkbox_status = false;
toggleCheckboxStatus = function(form) {
	if(checkbox_status) {
		for (i = 0; i < form.elements.length; i++) {
			if (form.elements[i].type == "checkbox") {
				form.elements[i].checked = false;
			}
		}	
		checkbox_status = false;
	}
	else {
		for (i = 0; i < form.elements.length; i++) {
			if (form.elements[i].type == "checkbox") {
				form.elements[i].checked = true;
			}
		}	
		checkbox_status = true;	
	}
}	

ccm_starFile = function (img,fID) {				
	var action = '';
	if ($(img).attr('src').indexOf(CCM_STAR_STATES.unstarred) != -1) {
		$(img).attr('src',$(img).attr('src').replace(CCM_STAR_STATES.unstarred,CCM_STAR_STATES.starred));
		action = 'star';
	}
	else {
		$(img).attr('src',$(img).attr('src').replace(CCM_STAR_STATES.starred,CCM_STAR_STATES.unstarred));
		action = 'unstar';
	}
	
	$.post(CCM_TOOLS_PATH + '/' + CCM_STAR_ACTION,{'action':action,'file-id':fID},function(data, textStatus){
		//callback, in case we want to do some post processing
	});
}
