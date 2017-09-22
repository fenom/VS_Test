


class LadderWindow {


    constructor(hsFormats, hsTimes, ladder_ranks) {

        this.window = document.querySelector('#ladderWindow')
        this.chartDiv = document.querySelector('#ladderWindow #chart1')
        this.totGamesDiv = document.querySelector('#ladderWindow .content-header .nrGames')
        this.rankFolder = document.querySelector('#ladderWindow .content-header #rankBtn')
        this.optionButtons = document.querySelectorAll('#ladderWindow .optionBtn')
        this.firebasePath = (PREMIUM) ? 'premiumData/ladderData' : 'data/ladderData'
        this.firebaseHistoryPath = (PREMIUM) ? 'premiumData/historyData' : ''
        
        this.fontColor = '#222'
        this.fontColorLight = '#999'

        // table
        this.colorScale_c1 = [255,255,255]
        this.colorScale_c2 = [87, 125, 186]
        this.colorScale_f = 0.15

        this.archetypeColors = {
            Standard: {},
            Wild: {},
        }

        this.data = {}
        this.hsFormats = hsFormats
        this.hsTimes = hsTimes
        this.ranks = ladder_ranks
        this.archColors = {
            Standard: {},
            Wild: {},
        }


        // Defaults

        this.f = 'Standard'
        this.t = 'lastDay'
        this.r = 'ranks_all'
        this.plotType = 'bar' // bar, line, pie, number,  !!! timeline
        this.plotTypes = ['bar','line','pie','number','timeline']
        this.mode = 'classes' // classes, decks
        this.fullyLoaded = false
        this.history = null


        for (var f of this.hsFormats) {
            this.data[f] = {}
            for (var t of this.hsTimes) {
                this.data[f][t] = null
        }}

        this.loadData()
        this.setupUI()
        this.renderOptions()
    } // close Constructor


    setupUI() {
        for (var btn of this.optionButtons) { btn.addEventListener("click", this.buttonTrigger.bind(this)) }


        document.querySelector('#ladderWindow #formatFolder .dropdown').innerHTML = ""
        for (var f of this.hsFormats) {
            var btn = document.createElement('button')
            btn.className = 'optionBtn folderBtn'
            btn.innerHTML = f
            btn.id = f
            const trigger = function (e) {this.f = e.target.id; this.plot()}
            btn.onclick = trigger.bind(this)
            document.querySelector('#ladderWindow #formatFolder .dropdown').appendChild(btn)
        }

        document.querySelector('#ladderWindow #timeFolder .dropdown').innerHTML = ""
        for (var t of this.hsTimes) {
            var btn = document.createElement('button')
            btn.className = 'optionBtn folderBtn'
            btn.innerHTML = btnIdToText[t]
            btn.id = t
            const trigger = function (e) {this.t = e.target.id; this.plot()}
            btn.onclick = trigger.bind(this)
            document.querySelector('#ladderWindow #timeFolder .dropdown').appendChild(btn)
        }

        document.querySelector('#ladderWindow #rankFolder .dropdown').innerHTML = ""
        for (var r of this.ranks) {
            var btn = document.createElement('button')
            btn.className = 'optionBtn folderBtn'
            btn.innerHTML = btnIdToText[r]
            btn.id = r
            const trigger = function (e) {this.r = e.target.id; this.plot()}
            btn.onclick = trigger.bind(this)
            document.querySelector('#ladderWindow #rankFolder .dropdown').appendChild(btn)
        }

        var disp = (PREMIUM) ? 'inline' : 'none'
       
        document.querySelector('#ladderWindow .content-header #line').style.display = disp
        document.querySelector('#ladderWindow .content-header #decks').style.display = disp
        document.querySelector('#ladderWindow .content-header #classes').style.display = disp
        document.querySelector('#ladderWindow .content-header #number').style.display = disp
        document.querySelector('#ladderWindow .content-header #timeline').style.display = disp
        document.querySelector('#ladderWindow .content-header .nrGames').onmouseover = this.showGames.bind(this)
        document.querySelector('#ladderWindow .content-header .nrGames').onmouseout = this.hideGames.bind(this)

        this.optionButtons = document.querySelectorAll('#ladderWindow .optionBtn')
    }

    showGames() { if (this.plotType == 'bar') {this.data[this.f][this.t].annotate(true)} }
    hideGames() { this.data[this.f][this.t].annotate(false); }

    buttonTrigger(e) {

        var btnID = e.target.id

        // if (btnID == 'lastDay')     {this.t = 'lastDay'}
        // if (btnID == 'lastWeek')    {this.t = 'lastWeek'}
        // if (btnID == 'lastMonth')   {this.t = 'lastMonth'}

        // if (btnID == 'Standard')    {this.f = 'Standard'}
        // if (btnID == 'Wild')        {this.f = 'Wild'}

        // if (btnID == 'ranks_all')   {this.r = 'ranks_all'}
        // if (btnID == 'ranks_L_5')   {this.r = 'ranks_L_5'}
        // if (btnID == 'ranks_6_15')  {this.r = 'ranks_6_15'}

        if (btnID == 'classes')     {this.mode = 'classes'}
        if (btnID == 'decks')       {this.mode = 'decks'}

        if (btnID == 'bar')         {this.plotType = 'bar'}
        if (btnID == 'line')        {this.plotType = 'line'}
        if (btnID == 'pie')         {this.plotType = 'pie'}
        if (btnID == 'number')      {this.plotType = 'number'}
        if (btnID == 'timeline')    {this.plotType = 'timeline'}
        
        this.plot()
    }// button Handler




    renderOptions() {

        for (var btn of this.optionButtons) { 
            btn.classList.remove('highlighted')

            if (btn.id == this.mode) {btn.classList.add('highlighted')}
            if (btn.id == this.plotType) {btn.classList.add('highlighted')}
        }
        document.querySelector("#ladderWindow #formatBtn").innerHTML =    btnIdToText[this.f]
        document.querySelector("#ladderWindow #timeBtn").innerHTML =      btnIdToText[this.t]
        document.querySelector("#ladderWindow #rankBtn").innerHTML =     btnIdToText[this.r]
    }




    loadData() {
        var ref = DATABASE.ref(this.firebasePath)
        ref.on('value',this.readData.bind(this), e => console.log('Could not load Ladder Data',e))
        
        if (PREMIUM) {
            var ref2 = DATABASE.ref(this.firebaseHistoryPath)
            ref2.on('value',this.addHistoryData.bind(this), e => console.log('Could not load history data',e))
        }
    }



    readData(DATA) {

        var ladderData = DATA.val()
        for (var f of this.hsFormats) {
            for (var t of this.hsTimes) {
                this.data[f][t] = new Ladder(ladderData[f][t],f,t,this) 
        }}
        this.fullyLoaded = true
        console.log('ladder loaded: '+ (performance.now()-t0).toFixed(2)+' ms')
        finishedLoading()
    }
    
    addHistoryData(DATA) { this.history = new History(DATA.val(),this) }



    plot () { 
        this.renderOptions()
        if (this.plotType == 'timeline') {this.history.plot(); return}
        this.data[this.f][this.t].plot();
    }

    getArchColor(hsClass, arch, hsFormat) {
        var archName
        if (hsClass) { archName = arch +' '+hsClass }
        else {
            archName = arch;
            for (var c of hsClasses) {if (archName.indexOf(c) != -1) {hsClass = c; break} }
        }

        if (archName in this.archColors[hsFormat]) { return this.archColors[hsFormat][archName] }
        else {
            var color = colorStringRange(hsColors[hsClass],30)
            var fontColor = hsFontColors[hsClass]
            this.archColors[hsFormat][archName] = {color: color, fontColor: fontColor}
            return this.archColors[hsFormat][archName]
        }
    }

    setTotGames(totGames) { this.totGamesDiv.innerHTML = totGames.toLocaleString()+" games" }
    showRankFolder() { this.rankFolder.style.display = 'flex' }
    hideRankFolder() { this.rankFolder.style.display = 'none' }

} // close LadderWindow




















