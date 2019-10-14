$(document).ready(function(){
    $('.delete-note').on('click', function(ev) {
        $target = $(ev.target);
        const name = $target.attr('data-id');
        console.log(name);
        $.ajax({
            type: 'DELETE',
            url: '/article/'+ name,
            success: function(res){
                alert('Note Deleted');
                window.location.href='/';
            },
            error: function(err) {
                console.log('Error:' + err);
            }
        });
    });

    // $('.edit-note').on('click', function(ev) {
    //     console.log("button edit");
    // })
});