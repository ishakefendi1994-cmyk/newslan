jQuery(document).ready(function ($) {
    console.log('[Flazz AI] Admin JS v1.0.3 Loaded');
    console.log('[Flazz AI] AJAX URL:', flazzData.ajax_url);

    // MANUAL TOOLS: Preset Selector fills URL field
    // ==========================================================================
    $(document).on('change', '#flazz_manual_preset', function () {
        var url = $(this).val();
        if (url) {
            $('#flazz_manual_rss_url').val(url);
        }
    });

    // Show/hide thumbnail style row based on image mode
    function toggleThumbnailStyleRow() {
        if ($('#flazz_research_image_mode').val() === 'generate_ai') {
            $('#row-thumbnail-style').show();
        } else {
            $('#row-thumbnail-style').hide();
        }
    }

    // Run on page load (in case browser remembered the select value)
    toggleThumbnailStyleRow();

    // Run on change
    $(document).on('change', '#flazz_research_image_mode', function () {
        toggleThumbnailStyleRow();
    });

    // MANUAL TOOLS: Fetch RSS Now
    // ==========================================================================
    $(document).on('click', '#flazz-manual-fetch', function (e) {
        e.preventDefault();
        var $btn = $(this);
        var $status = $('#flazz-fetch-status');
        var rssUrl = $('#flazz_manual_rss_url').val().trim();

        $btn.prop('disabled', true).text('⏳ Memproses...');
        $status.html('<span style="color:#d64e07;">⏳ Sedang mengambil dan memproses berita...</span>');
        console.log('[Flazz AI] Manual Fetch started. URL:', rssUrl);

        $.post(flazzData.ajax_url, {
            action: 'flazz_manual_fetch',
            nonce: flazzData.nonce,
            rss_url: rssUrl
        }, function (response) {
            console.log('[Flazz AI] Fetch Response:', response);
            $btn.prop('disabled', false).text('▶ Fetch & Proses Sekarang');
            if (response.success) {
                $status.html('<span style="color:green;">✅ ' + response.data + '</span>');
            } else {
                $status.html('<span style="color:#d63638;">❌ ' + response.data + '</span>');
            }
        }).fail(function (xhr, status, error) {
            console.error('[Flazz AI] Fetch FAIL - Status:', xhr.status, 'Text:', xhr.responseText);
            $btn.prop('disabled', false).text('▶ Fetch & Proses Sekarang');
            $status.html('<span style="color:#d63638;">❌ HTTP Error ' + xhr.status + ' — ' + error + '</span>');
        });
    });

    // MANUAL TOOLS: Quick Research
    // ==========================================================================
    $(document).on('click', '#flazz-start-research', function () {
        var $btn = $(this);
        var $status = $('#flazz-research-status');
        var keyword = $('#flazz_research_keyword').val().trim();
        var style = $('#flazz_research_style').val() || 'Professional';
        var model = $('#flazz_research_model').val() || 'Straight News';
        var imgMode = $('#flazz_research_image_mode').val() || 'rss';
        var thumbStyle = $('#flazz_research_thumbnail_style').val() || 'editorial_vector';

        if (!keyword) {
            alert('Masukkan kata kunci terlebih dahulu.');
            return;
        }

        $btn.prop('disabled', true).text('⏳ Sedang riset...');

        var waitMsg = imgMode === 'generate_ai'
            ? '⏳ Mengambil berita + Generate gambar AI via Replicate... (bisa 60–90 detik)'
            : '⏳ Mengambil berita dari Google News dan memproses AI... (bisa 30–60 detik)';
        $status.html('<span style="color:#d64e07;">' + waitMsg + '</span>');
        console.log('[Flazz AI] Research:', keyword, '| Style:', style, '| Model:', model, '| Image:', imgMode, '| Thumb:', thumbStyle);


        $.post(flazzData.ajax_url, {
            action: 'flazz_research_keyword',
            nonce: flazzData.nonce,
            keyword: keyword,
            writing_style: style,
            article_model: model,
            image_mode: imgMode,
            thumbnail_style: thumbStyle,
            research_scope: $('#flazz_research_scope').val(),
            target_language: $('#flazz_research_language').val()
        }, function (response) {
            console.log('[Flazz AI] Research Response:', response);
            $btn.prop('disabled', false).text('🔬 Mulai Riset & Posting');
            if (response.success) {
                $status.html('<span style="color:green;">✅ ' + response.data + '</span>');
                $('#flazz_research_keyword').val('');
            } else {
                $status.html('<span style="color:#d63638;">❌ ' + response.data + '</span>');
            }
        }).fail(function (xhr, status, error) {
            console.error('[Flazz AI] Research FAIL - Status:', xhr.status, 'Text:', xhr.responseText.substring(0, 500));
            $btn.prop('disabled', false).text('🔬 Mulai Riset & Posting');
            $status.html('<span style="color:#d63638;">❌ HTTP Error ' + xhr.status + ' — Cek tab Network di DevTools untuk detail.</span>');
        });
    });

    // SETTINGS: Test API
    // ==========================================================================
    $(document).on('click', '#flazz-test-api', function () {
        var $btn = $(this);
        var $status = $('#test-api-status');

        $btn.prop('disabled', true).text('⏳ Testing...');
        $status.html('<span style="color:#666;">Menghubungi Groq...</span>');
        console.log('[Flazz AI] Testing API connection...');

        $.post(flazzData.ajax_url, {
            action: 'flazz_test_api',
            nonce: flazzData.nonce
        }, function (response) {
            console.log('[Flazz AI] API Test Response:', response);
            $btn.prop('disabled', false).text('🧪 Test Koneksi');
            if (response.success) {
                $status.html('<span style="color:green;">✅ ' + response.data + '</span>');
            } else {
                $status.html('<span style="color:#d63638;">❌ ' + response.data + '</span>');
            }
        }).fail(function (xhr, status, error) {
            console.error('[Flazz AI] API Test FAIL - Status:', xhr.status, 'Resp:', xhr.responseText.substring(0, 500));
            $btn.prop('disabled', false).text('🧪 Test Koneksi');
            $status.html('<span style="color:#d63638;">❌ HTTP ' + xhr.status + ' — ' + error + '</span>');
        });
    });

    // SETTINGS: Test AI Image
    $(document).on('click', '#flazz-test-ai-image', function (e) {
        e.preventDefault();
        console.log('[Flazz AI] Test AI Image clicked');

        var $btn = $(this);
        var $status = $('#test-image-status');
        var prompt = $('#flazz-test-image-prompt').val().trim();

        if (!prompt) {
            alert('Masukkan prompt terlebih dahulu.');
            return;
        }

        console.log('[Flazz AI] Starting image test with prompt:', prompt);
        $btn.prop('disabled', true).text('⏳ Generating Image...');
        $status.html('<span style="color:#666;">Menghubungi Cloud Orchestrator & Replicate... (bisa 30-60 detik)</span>');

        $.post(flazzData.ajax_url, {
            action: 'flazz_test_ai_image',
            nonce: flazzData.nonce,
            prompt: prompt
        }, function (response) {
            console.log('[Flazz AI] AI Image Test Response:', response);
            $btn.prop('disabled', false).text('🚀 Generate Test Image');
            if (response.success) {
                $status.html('<div style="margin-top:10px;"><p style="color:green; font-weight:bold;">✅ Berhasil!</p><img src="' + response.data + '" style="max-width:100%; border-radius:8px; border:1px solid #ddd; margin-top:5px;"></div>');
            } else {
                $status.html('<span style="color:#d63638;">❌ ' + response.data + '</span>');
            }
        }).fail(function (xhr, status, error) {
            console.error('[Flazz AI] AI Image Test FAIL:', status, error, xhr.responseText);
            $btn.prop('disabled', false).text('🚀 Generate Test Image');
            $status.html('<span style="color:#d63638;">❌ HTTP ' + xhr.status + ' — ' + error + '</span>');
        });
    });

    // AUTO-JOBS: Open / Close form
    // ==========================================================================
    $(document).on('click', '#flazz-open-job-form', function () {
        // Reset form for "New" mode
        $('#job_id').val(0);
        $('#job-form-title').text('Buat Auto-Job Baru');
        $('#job_name, #job_keyword, #job_rss_url, #job_ai_idea').val('');
        $('#job_type').val('keyword').trigger('change');

        $('#flazz-job-form-container').hide().slideDown();
        $(this).hide();
    });

    $(document).on('click', '#flazz-close-job-form', function () {
        $('#flazz-job-form-container').slideUp();
        $('#flazz-open-job-form').show();
    });

    // AUTO-JOBS: Edit
    $(document).on('click', '.edit-job', function (e) {
        e.preventDefault();
        var $btn = $(this);
        var data = $btn.data();

        // Populate fields
        $('#job_id').val(data.id);
        $('#job-form-title').text('📝 Edit Job: ' + data.name);
        $('#job_name').val(data.name);
        $('#job_type').val(data.type).trigger('change');
        $('#job_keyword').val(data.keyword);
        $('#job_rss_url').val(data.rss_url);
        $('#job_ai_idea').val(data.ai_idea);
        $('#job_category').val(data.category);
        $('#job_max_articles').val(data.max_articles);
        $('#job_writing_style').val(data.writing_style);
        $('#job_article_model').val(data.article_model);
        $('#job_image_mode').val(data.image_mode).trigger('change');
        $('#job_thumbnail_style').val(data.thumbnail_style);
        $('#job_target_language').val(data.target_language);
        $('#job_research_scope').val(data.research_scope);

        // Show form and scroll
        $('#flazz-job-form-container').hide().slideDown();
        $('#flazz-open-job-form').hide();
        $('html, body').animate({
            scrollTop: $("#flazz-job-form-container").offset().top - 50
        }, 500);
    });

    // Toggle keyword/rss/idea rows based on job type
    $(document).on('change', '#job_type', function () {
        var type = $(this).val();
        $('#row-keyword, #row-rss, #row-ai-idea, #row-research-scope').hide();

        if (type === 'rss_watcher') {
            $('#row-rss').show();
        } else if (type === 'ai_editor') {
            $('#row-ai-idea').show();
        } else {
            $('#row-keyword').show();
            $('#row-research-scope').show();
        }
    });

    // Toggle job thumbnail style row
    $(document).on('change', '#job_image_mode', function () {
        if ($(this).val() === 'generate_ai') {
            $('#row-job-thumbnail-style').show();
        } else {
            $('#row-job-thumbnail-style').hide();
        }
    });

    // AUTO-JOBS: Save
    $(document).on('click', '#flazz-save-job', function () {
        var $btn = $(this);
        var jobName = $('#job_name').val().trim();
        var jobId = $('#job_id').val();

        if (!jobName) {
            alert('Nama Job wajib diisi!');
            return;
        }

        $btn.prop('disabled', true).text('⏳ Menyimpan...');
        console.log('[Flazz AI] Saving job:', jobName, 'ID:', jobId);

        $.post(flazzData.ajax_url, {
            action: 'flazz_save_job',
            nonce: flazzData.nonce,
            job_id: jobId,
            job_name: jobName,
            job_type: $('#job_type').val(),
            keyword: $('#job_keyword').val(),
            rss_url: $('#job_rss_url').val(),
            ai_idea: $('#job_ai_idea').val(),
            category: $('#job_category').val(),
            article_model: $('#job_article_model').val(),
            image_mode: $('#job_image_mode').val(),
            thumbnail_style: $('#job_thumbnail_style').val(),
            max_articles: $('#job_max_articles').val(),
            writing_style: $('#job_writing_style').val(),
            target_language: $('#job_target_language').val(),
            research_scope: $('#job_research_scope').val(),
            publish_status: 'publish'
        }, function (response) {
            console.log('[Flazz AI] Save Job Response:', response);
            if (response.success) {
                alert('✅ ' + response.data);
                location.reload();
            } else {
                alert('❌ ' + response.data);
                $btn.prop('disabled', false).text('💾 Simpan Job');
            }
        }).fail(function (xhr, status, error) {
            console.error('[Flazz AI] Save Job FAIL:', xhr.status, error);
            alert('❌ HTTP Error ' + xhr.status);
            $btn.prop('disabled', false).text('💾 Simpan Job');
        });
    });

    // AUTO-JOBS: Run
    $(document).on('click', '.run-job', function () {
        var $btn = $(this);
        var jobId = $btn.data('id');
        var orig = $btn.text();

        $btn.prop('disabled', true).text('⏳ Running...');
        console.log('[Flazz AI] Running job ID:', jobId);

        $.post(flazzData.ajax_url, {
            action: 'flazz_run_job',
            nonce: flazzData.nonce,
            job_id: jobId
        }, function (response) {
            console.log('[Flazz AI] Run Job Response:', response);
            $btn.prop('disabled', false).text(orig);
            if (response.success) {
                alert('✅ ' + response.data);
            } else {
                alert('❌ ' + response.data);
            }
        }).fail(function (xhr, status, error) {
            console.error('[Flazz AI] Run Job FAIL:', xhr.status, xhr.responseText.substring(0, 500));
            $btn.prop('disabled', false).text(orig);
            alert('❌ HTTP Error ' + xhr.status + '. Cek Server Error Log untuk detail.');
        });
    });

    // AUTO-JOBS: Delete
    $(document).on('click', '.delete-job', function () {
        if (!confirm('Yakin hapus job ini?')) return;

        var $btn = $(this);
        var jobId = $btn.data('id');

        $.post(flazzData.ajax_url, {
            action: 'flazz_delete_job',
            nonce: flazzData.nonce,
            job_id: jobId
        }, function (response) {
            if (response.success) {
                $btn.closest('tr').fadeOut(400, function () { $(this).remove(); });
            } else {
                alert('❌ ' + response.data);
            }
        }).fail(function (xhr) {
            alert('❌ HTTP Error ' + xhr.status);
        });
    });
});
