const socket = io()

// Elements 
const form = document.querySelector('form')
const input = document.querySelector('.message')
const btn = document.querySelector('button')
const locationButton = document.querySelector('.send-location')
const messages = document.querySelector('.messages')

// Templates
const messageTemplate = document.querySelector('.message-template').innerHTML
const locationTemplate = document.querySelector('.location-template').innerHTML
const sidebarTemplate = document.querySelector('.sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
    // New message element
    const newMessage = messages.lastElementChild

    // Height of the last new message
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = messages.offsetHeight

    // Height of messages container
    const containerHeight = messages.scrollHeight

    // Distance scrolled
    const scrollOffset = messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('H:mm')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('location', (locationMessage) => {
    console.log(locationMessage)
    
    const html = Mustache.render(locationTemplate, {
        username: locationMessage.username,
        url: locationMessage.url,
        createdAt: moment(locationMessage.createdAt).format('H:mm')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('.chat__sidebar').innerHTML = html
})

form.addEventListener('submit', (e) => {
    e.preventDefault()

    btn.setAttribute('disabled', 'disabled')

    const message = input.value
    
    socket.emit('sendMessage', message, () => {
        btn.removeAttribute('disabled')
        input.value = ''
        input.focus()
        
        console.log('Delivered')
    })
})

locationButton.addEventListener('click', (e) => {
    e.preventDefault()

    locationButton.setAttribute('disabled', 'disabled')

    if (!navigator.geolocation) {
        return alert('Browser does not support geolocation')
    }
    
    navigator.geolocation.getCurrentPosition((position) => {
        const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }

        socket.emit('sendLocation', location, () => {
            locationButton.removeAttribute('disabled')

            console.log('Location shared!')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})