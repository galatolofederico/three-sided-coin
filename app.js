$("#run").click(function(){
    ratio = Number.parseFloat($("#ratio").val())
    coins = Number.parseFloat($("#coins").val())
    tot_time = Number.parseFloat($("#time").val())
    step_time = Number.parseFloat(eval($("#step").val()))
    time = 0
    radius = ratio
    bodies = []
    meshes = []
    init()
    animate()
    events.once("finish", function(){
        $("#modaldiv").html("<table style='width:100%'>"+
        "<tr><th>Up</th><th>"+up+"</th></tr>"+
        "<tr><th>Down</th><th>"+down+"</th></tr>"+
        "<tr><th>Side</th><th>"+side+"</th></tr></table>")
        $("#modal").modal("toggle")
    })
})

events.on("progress", function(p){
    $("#progress").css("width", Number.parseInt(p*100)+"%")
})