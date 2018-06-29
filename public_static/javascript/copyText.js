$('#copy').click(function () {
    var copyText = $('#url');
    copyText.select();
    document.execCommand("copy");
    alert("Copied the text: " + copyText.val());
});